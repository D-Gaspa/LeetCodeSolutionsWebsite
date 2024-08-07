import {ref, Ref} from 'vue'

export interface Image {
    id: string
    name: string
    url: string
    file?: File
}

export function useMdEditorImageManagement(initialImages: Image[] = [], enableImages: boolean) {
    const images: Ref<Image[]> = ref(enableImages ? initialImages : [])
    const showImageGallery = ref(false)

    const addImage = (file: File): Promise<Image> => {
        if (!enableImages) {
            console.warn('Image functionality is disabled')
            return Promise.reject('Image functionality is disabled')
        }

        console.log('Adding image in useMdEditorImageManagement', file)

        return new Promise<Image>((resolve) => {
            const reader = new FileReader()
            reader.onload = (e) => {
                const newImage: Image = {
                    id: `${file.name.replace(/\s+/g, '-')}-${Date.now()}`,
                    name: file.name,
                    url: e.target?.result as string,
                    file: file
                }
                images.value.push(newImage)
                resolve(newImage)
            }
            reader.readAsDataURL(file)
        })
    }

    const removeImage = (id: string) => {
        if (!enableImages) {
            console.warn('Image functionality is disabled')
            return
        }

        const index = images.value.findIndex(img => img.id === id)
        if (index !== -1) {
            images.value.splice(index, 1)
        }
    }

    const toggleImageGallery = () => {
        if (!enableImages) {
            console.warn('Image functionality is disabled')
            return
        }

        showImageGallery.value = !showImageGallery.value
    }

    return {
        images,
        showImageGallery,
        addImage,
        removeImage,
        toggleImageGallery
    }
}