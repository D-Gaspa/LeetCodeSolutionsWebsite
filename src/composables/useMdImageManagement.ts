import {Ref, ref} from 'vue'
import {EditorView} from '@codemirror/view'

export interface MdImage {
    id: string;
    name: string;
    url: string;
    file?: File;
}

export function useMdImageManagement(enableImages: boolean, editorView: Ref<EditorView | null>) {
    const tempImages = ref<MdImage[]>([])
    const showImageGallery = ref(false)
    const imageMap = ref(new Map())

    const toggleImageGallery = () => {
        if (enableImages) {
            showImageGallery.value = !showImageGallery.value
        }
    }

    const handleImageUpload = async (files: FileList) => {
        if (!enableImages) return

        for (let i = 0; i < files.length; i++) {
            await addTempImage(files[i])
        }
    }

    const handlePaste = async (event: ClipboardEvent) => {
        if (!enableImages) return

        const items = event.clipboardData?.items
        if (items) {
            for (let i = 0; i < items.length; i++) {
                if (items[i].type.indexOf('image') !== -1) {
                    event.preventDefault()
                    const blob = items[i].getAsFile()
                    if (blob) {
                        await addTempImage(blob)
                    }
                    break
                }
            }
        }
    }

    const addTempImage = async (file: File) => {
        if (!file) return

        const reader = new FileReader()
        reader.onload = (e) => {
            const imageId = `${file.name.replace(/\s+/g, '-')}`
            const newImage: MdImage = {
                id: imageId,
                file: file,
                name: imageId,
                url: e.target?.result as string
            }

            const existingIndex = tempImages.value.findIndex(img => img.name === newImage.name)
            if (existingIndex !== -1) {
                tempImages.value.splice(existingIndex, 1, newImage)
            } else {
                tempImages.value.push(newImage)
            }

            imageMap.value.set(imageId, newImage)
        }
        reader.readAsDataURL(file)
    }

    const insertImageToEditor = (image: MdImage) => {
        if (editorView.value) {
            const imageMarkdown = `![${image.name}](${image.id})\n`
            const {from} = editorView.value.state.selection.main
            editorView.value.dispatch({
                changes: {
                    from,
                    insert: imageMarkdown,
                },
                selection: {anchor: from + imageMarkdown.length},
            })
            editorView.value.focus()

            if (!tempImages.value.some(img => img.id === image.id)) {
                tempImages.value.push(image)
            }
        }
    }

    const removeImage = (index: number) => {
        const image = tempImages.value[index]

        // Remove all occurrences of the image from the Markdown content
        if (editorView.value) {
            const content = editorView.value.state.doc.toString()
            const imageRegex = new RegExp(`!\\[${image.name}\\]\\(${image.id}\\)`, 'g')
            const newContent = content.replace(imageRegex, '')
            editorView.value.dispatch({
                changes: {from: 0, to: content.length, insert: newContent}
            })
        }

        tempImages.value.splice(index, 1)
        imageMap.value.delete(image.id)

        if (image.url.startsWith('blob:')) {
            URL.revokeObjectURL(image.url)
        }
    }

    return {
        tempImages,
        showImageGallery,
        toggleImageGallery,
        handleImageUpload,
        handlePaste,
        addTempImage,
        insertImageToEditor,
        removeImage,
    }
}