import {ref} from 'vue'

export interface Image {
    id: string
    name: string
    url: string
    file?: File
}

export function useMdEditorImageManagement(initialImages: Image[] = []) {
    const images = ref<Image[]>(initialImages)
    const showImageGallery = ref(false)

    const addImage = (file: File) => {
        return new Promise<Image>((resolve) => {
            const reader = new FileReader()
            reader.onload = (e) => {
                const newImage: Image = {
                    id: `${file.name.replace(/\s+/g, '-')}`,
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
        const index = images.value.findIndex(img => img.id === id)
        if (index !== -1) {
            images.value.splice(index, 1)
        }
    }

    const toggleImageGallery = () => {
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