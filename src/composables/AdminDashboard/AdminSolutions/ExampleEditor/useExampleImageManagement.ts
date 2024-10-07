import {useNotification} from "@/composables/Common/useNotification"
import {deleteImageFromStorage, getPublicUrl, uploadNewImage} from '@/utils/imageOperations'
import type {ExampleVisualization} from '@/types/Problem'

export function useExampleImageManagement(solutionId: number) {
    const {showNotification, updateNotification} = useNotification()

    const handleImageManagement = async (
        currentImages: ExampleVisualization[],
        originalImages: ExampleVisualization[]
    ): Promise<{ success: boolean; error?: string; updatedImages?: ExampleVisualization[] }> => {
        const notificationId = showNotification('Processing example images...', 'loading')

        try {
            const imagesToDelete = originalImages.filter(
                orig => !currentImages.some(curr => curr.id === orig.id)
            )

            await deleteImages(imagesToDelete, notificationId)

            const lastId = Math.max(...originalImages.map(img => parseInt(img.id.split('-')[2])), 0)

            const newImages = currentImages.filter(curr => !curr.id.startsWith(solutionId.toString()))
            const uploadedImages = await uploadNewImages(newImages, solutionId, lastId, notificationId)

            const updatedImages = [
                ...originalImages.filter(orig => !imagesToDelete.includes(orig)),
                ...uploadedImages
            ]

            updateNotification(notificationId, {
                message: 'Image processing completed successfully',
                type: 'success',
                isLoading: false,
            })

            return {success: true, updatedImages}
        } catch (error) {
            updateNotification(notificationId, {
                message: `Error processing images: ${(error as Error).message}`,
                type: 'error',
                isLoading: false,
            })
            return {success: false, error: (error as Error).message}
        }
    }

    const deleteImages = async (images: ExampleVisualization[], notificationId: number): Promise<void> => {
        for (const image of images) {
            updateNotification(notificationId, {message: `Deleting image ${image.name}...`})
            const result = await deleteImageFromStorage(image.name, 'example-images')
            if (!result.success) {
                throw new Error(`Failed to delete image ${image.name}: ${result.error}`)
            }
        }
    }

    const uploadNewImages = async (
        images: ExampleVisualization[],
        solutionId: number,
        lastId: number,
        notificationId: number
    ): Promise<ExampleVisualization[]> => {
        const uploadedImages: ExampleVisualization[] = []

        for (let i = 0; i < images.length; i++) {
            const image = images[i]
            const newId = lastId + i + 1
            const newName = `${solutionId}-example-${newId}`

            updateNotification(notificationId, {message: `Uploading image ${newName}...`})

            if (!(image.file instanceof File)) {
                throw new Error(`Image ${image.name} is not a File object`)
            }

            const uploadResult = await uploadNewImage(image.file, newName, 'example-images')
            if (!uploadResult.success) {
                throw new Error(`Failed to upload image ${newName}: ${uploadResult.error}`)
            }

            const urlResult = await getPublicUrl(newName, 'example-images')
            if (!urlResult.success || !urlResult.url) {
                throw new Error(`Failed to get public URL for image ${newName}: ${urlResult.error}`)
            }

            uploadedImages.push({
                id: newName,
                name: newName,
                url: urlResult.url,
                associatedSteps: image.associatedSteps
            })
        }

        return uploadedImages
    }

    return {
        handleImageManagement
    }
}