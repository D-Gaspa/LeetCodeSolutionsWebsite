import {deleteImageFromStorage, getPublicUrl, renameExistingImage, uploadNewImage} from '@/utils/imageOperations'
import {useNotification} from "@/composables/Common/useNotification"
import type {MdImage} from '@/types/Problem'

interface PreparedImage extends MdImage {
    tempName: string
    tempUrl: string
    originalName: string
}

interface ImageManagementResult {
    success: boolean
    error?: string
    renamedImages?: MdImage[]
    updatedContent?: string
}

export function useImageManagement() {
    const {updateNotification} = useNotification()

    const areImagesChanged = (newImages: MdImage[], originalImages: MdImage[]): boolean => {
        if (newImages.length !== originalImages.length) return true
        return newImages.some((newImg, index) => {
            const origImg = originalImages[index]
            return newImg.id !== origImg.id || newImg.name !== origImg.name || newImg.url !== origImg.url
        })
    }

    const getOrderedImages = (content: string, images: MdImage[]): MdImage[] => {
        const imageRegex = /!\[([^\]]*)]\(([^)]+)\)/g
        const orderedImages: MdImage[] = []
        let match: RegExpExecArray | null

        while ((match = imageRegex.exec(content)) !== null) {
            const [, , src] = match
            const image = images.find(img => img.id === src || img.url === src)
            if (image && !orderedImages.includes(image)) {
                orderedImages.push(image)
            }
        }
        return orderedImages
    }

    const handleImageManagement = async (
        currentImages: MdImage[],
        originalImages: MdImage[],
        problemNumber: number,
        content: string,
        notificationId: number
    ): Promise<ImageManagementResult> => {
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
        const firstPassResult = await prepareImages(orderedCurrentImages, content, notificationId)
        if (!firstPassResult.success) {
            return {success: false, error: firstPassResult.error}
        }

        // Second pass: Rename all images to their final names
        updateNotification(notificationId, {message: 'Finalizing images...'})
        const renameResult = await renameAndUploadImages(firstPassResult.preparedImages!, firstPassResult.updatedContent!, problemNumber, notificationId)
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

    const prepareImages = async (
        orderedImages: MdImage[],
        content: string,
        notificationId: number
    ): Promise<{ success: boolean; error?: string; preparedImages?: PreparedImage[]; updatedContent?: string }> => {
        const preparedImages: PreparedImage[] = []
        let updatedContent = content
        let imageCounter = 1

        for (const image of orderedImages) {
            let tempName: string, tempUrl: string
            if (image.file instanceof File) {
                // New image: upload with temporary name
                tempName = `new_${imageCounter++}_${image.name}`
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
                const urlResult = await getPublicUrl(tempName)
                if (!urlResult.success || !urlResult.url) {
                    return {success: false, error: urlResult.error || 'Failed to get public URL'}
                }
                tempUrl = urlResult.url
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
                const urlResult = await getPublicUrl(tempName)
                if (!urlResult.success || !urlResult.url) {
                    return {success: false, error: urlResult.error || 'Failed to get public URL'}
                }
                tempUrl = urlResult.url
            }

            // Update content with temporary name
            const oldImagePattern = new RegExp(`!\\[${escapeRegExp(image.id)}]\\([^)]+\\)`, 'g')
            updatedContent = updatedContent.replace(oldImagePattern, `![${tempName}](${tempUrl})`)

            preparedImages.push({
                ...image,
                tempName: tempName,
                tempUrl: tempUrl,
                originalName: image.name
            })
        }
        return {success: true, preparedImages, updatedContent}
    }

    const renameAndUploadImages = async (
        preparedImages: PreparedImage[],
        content: string,
        problemNumber: number,
        notificationId: number
    ): Promise<{ success: boolean; error?: string; renamedImages?: MdImage[]; updatedContent?: string }> => {
        const renamedImages: MdImage[] = []
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
            if (!urlResult.success || !urlResult.url) {
                updateNotification(notificationId, {
                    message: urlResult.error || 'Failed to get public URL',
                    type: 'error',
                    isLoading: false,
                    duration: 3000
                })
                return {success: false, error: urlResult.error || 'Failed to get public URL'}
            }
            const newUrl = urlResult.url

            // Update content
            try {
                const tempImagePattern = new RegExp(`!\\[${escapeRegExp(image.tempName)}]\\([^)]+\\)`, 'g')
                updatedContent = updatedContent.replace(tempImagePattern, `![${newFileName}](${newUrl})`)
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
                file: image.file
            })

            imageCounter++
        }

        return {success: true, renamedImages, updatedContent}
    }

    function escapeRegExp(string: string): string {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    }

    return {
        areImagesChanged,
        handleImageManagement,
    }
}