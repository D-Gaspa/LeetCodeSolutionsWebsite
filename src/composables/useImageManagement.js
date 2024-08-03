import {inject} from 'vue'
import {deleteImageFromStorage, getPublicUrl, renameExistingImage, uploadNewImage} from '@/utils/imageOperations'

export function useImageManagement() {
    const updateNotification = inject('updateNotification')

    const areImagesChanged = (newImages, originalImages) => {
        if (newImages.length !== originalImages.length) return true
        return newImages.some((newImg, index) => {
            const origImg = originalImages[index]
            return newImg.id !== origImg.id || newImg.name !== origImg.name || newImg.url !== origImg.url
        })
    }

    const handleImageManagement = async (currentImages, originalImages, problemNumber, content, notificationId) => {
        // Order the current images based on their appearance in the content
        const orderedCurrentImages = getOrderedImages(content, currentImages)

        const imagesToDelete = originalImages.filter(
            orig => !orderedCurrentImages.some(curr => curr.url === orig.url)
        )

        if (imagesToDelete.length > 0) {
            updateNotification(notificationId, {
                message: `Deleting ${imagesToDelete.length} removed image(s)...`
            })

            // Delete removed images
            for (const image of imagesToDelete) {
                const deleteResult = await deleteImageFromStorage(image.name)
                if (!deleteResult.success) {
                    return {success: false, error: deleteResult.error}
                }
            }

            updateNotification(notificationId, {
                message: 'Removed images deleted successfully. Processing remaining images...'
            })
        }

        // Rename and upload all images (existing and new) based on their new order
        updateNotification(notificationId, {
            message: `Processing ${orderedCurrentImages.length} image(s)...`
        })

        const renameResult = await renameAndUploadImages(orderedCurrentImages, problemNumber, content, notificationId)
        if (!renameResult.success) {
            return {success: false, error: renameResult.error}
        }

        updateNotification(notificationId, {
            message: 'Image processing completed successfully'
        })

        return {
            success: true,
            renamedImages: renameResult.renamedImages,
            updatedContent: renameResult.updatedContent
        }
    }

    const getOrderedImages = (content, images) => {
        const imageRegex = /!\[([^\]]*)]\(([^)]+)\)/g
        const orderedImages = []
        let match

        while ((match = imageRegex.exec(content)) !== null) {
            const [, , src] = match
            const image = images.find(img => img.id === src || img.url === src)
            if (image && !orderedImages.includes(image)) {
                orderedImages.push(image)
            }
        }
        return orderedImages
    }

    const renameAndUploadImages = async (orderedImages, problemNumber, content, notificationId) => {
        const renamedImages = []
        let imageCounter = 1
        let updatedContent = content

        for (const image of orderedImages) {
            const fileExtension = image.name.split('.').pop()
            const newFileName = `${problemNumber}-problem-${imageCounter}.${fileExtension}`

            let newUrl

            if (image.name !== newFileName) {
                if (image.file instanceof File) {
                    // Upload new image
                    const uploadResult = await uploadNewImage(image.file, newFileName)
                    if (!uploadResult.success) {
                        updateNotification(notificationId, {
                            message: uploadResult.error,
                            type: 'error',
                            isLoading: false,
                            duration: 3000
                        })
                        return {success: false, error: uploadResult.error}
                    }
                } else {
                    // Rename existing image
                    const renameResult = await renameExistingImage(image.name, newFileName)
                    if (!renameResult.success) {
                        updateNotification(notificationId, {
                            message: renameResult.error,
                            type: 'error',
                            isLoading: false,
                            duration: 3000
                        })
                        return {success: false, error: renameResult.error}
                    }
                }

                // Get the public URL for the new or renamed image
                const urlResult = await getPublicUrl(newFileName)
                if (!urlResult.success) {
                    updateNotification(notificationId, {
                        message: urlResult.error,
                        type: 'error',
                        isLoading: false,
                        duration: 3000
                    })
                    return {success: false, error: urlResult.error}
                }
                newUrl = urlResult.url

                // Update content
                try {
                    if (image.file instanceof File) {
                        let newImagePattern = new RegExp(`!\\[([^\\]]*)]\\(${escapeRegExp(image.id)}\\)`, 'g')
                        updatedContent = updatedContent.replace(newImagePattern, `![${newFileName}](${newUrl})`)
                    } else {
                        let existingImagePattern = new RegExp(`!\\[([^\\]]*)]\\(${escapeRegExp(image.url)}\\)`, 'g')
                        updatedContent = updatedContent.replace(existingImagePattern, `![${newFileName}](${newUrl})`)
                    }
                } catch (error) {
                    updateNotification(notificationId, {
                        message: 'Error updating content',
                        type: 'error',
                        isLoading: false,
                        duration: 3000
                    })
                    return {success: false, error: 'Error updating content'}
                }
            } else {
                newUrl = image.url // Keep the existing URL if the image name hasn't changed
            }

            renamedImages.push({
                id: newFileName,
                name: newFileName,
                url: newUrl,
                file: image.file // Preserve the file object for new images
            })

            imageCounter++
        }

        return {success: true, renamedImages, updatedContent}
    }

    function escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    }

    return {
        areImagesChanged,
        handleImageManagement
    }
}