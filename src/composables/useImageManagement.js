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

        // First pass: Rename existing images and upload new images with temporary names
        updateNotification(notificationId, {message: 'Preparing images...'})
        const firstPassResult = await prepareImages(orderedCurrentImages, notificationId)
        if (!firstPassResult.success) {
            return {success: false, error: firstPassResult.error}
        }

        // Second pass: Rename all images to their final names
        updateNotification(notificationId, {message: 'Finalizing images...'})
        const renameResult = await renameAndUploadImages(firstPassResult.preparedImages, problemNumber, content, notificationId)
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

    const prepareImages = async (orderedImages, notificationId) => {
        const preparedImages = []
        const timestamp = Date.now()

        for (const image of orderedImages) {
            let tempName
            if (image.file instanceof File) {
                // New image: upload with temporary name
                tempName = `new_${timestamp}_${image.name}`
                const uploadResult = await uploadNewImage(image.file, tempName)
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
                // Existing image: rename to temporary name
                tempName = `existing_${image.name}`
                const renameResult = await renameExistingImage(image.name, tempName)
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

            preparedImages.push({
                ...image,
                tempName: tempName,
                originalName: image.name
            })
        }

        return {success: true, preparedImages}
    }

    const renameAndUploadImages = async (preparedImages, problemNumber, content, notificationId) => {
        const renamedImages = []
        let imageCounter = 1
        let updatedContent = content

        for (const image of preparedImages) {
            const fileExtension = image.originalName.split('.').pop()
            const newFileName = `${problemNumber}-problem-${imageCounter}.${fileExtension}`

            // Rename image from temporary name to final name
            const renameResult = await renameExistingImage(image.tempName, newFileName)
            if (!renameResult.success) {
                updateNotification(notificationId, {
                    message: renameResult.error,
                    type: 'error',
                    isLoading: false,
                    duration: 3000
                })
                return {success: false, error: renameResult.error}
            }

            // Get the public URL for the renamed image
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
            const newUrl = urlResult.url

            // Update content
            try {
                const oldImagePattern = new RegExp(`!\\[([^\\]]*)]\\(${escapeRegExp(image.id || image.url)}\\)`, 'g')
                updatedContent = updatedContent.replace(oldImagePattern, `![${newFileName}](${newUrl})`)
            } catch (error) {
                updateNotification(notificationId, {
                    message: 'Error updating content',
                    type: 'error',
                    isLoading: false,
                    duration: 3000
                })
                return {success: false, error: 'Error updating content'}
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