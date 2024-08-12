import {Ref, ref} from 'vue'
import {EditorView} from '@codemirror/view'
import {useNotification} from "../useNotification"

export interface MdImage {
    id: string
    name: string
    url: string
    file?: File | null
}

export function useMdImageManagement(
    enableImages: boolean,
    editorView: Ref<EditorView | null>,
    tempImages: Ref<MdImage[]>,
    updateImageMap: () => void,
    {showNotification, updateNotification}: ReturnType<typeof useNotification>
) {
    const showImageGallery = ref(false)

    const toggleImageGallery = () => {
        if (enableImages) {
            showImageGallery.value = !showImageGallery.value
        }
    }

    const handleImageUpload = async (files: FileList) => {
        if (!enableImages) return

        const notificationId = showNotification('Uploading images...', 'loading', {isLoading: true})

        try {
            for (let i = 0; i < files.length; i++) {
                updateNotification(notificationId, {message: `Uploading image ${i + 1} of ${files.length}...`})
                await addTempImage(files[i])
            }
            let message = files.length > 1 ? 'Images uploaded successfully' : 'Image uploaded successfully'
            updateNotification(notificationId, {
                message: message,
                type: 'success',
                isLoading: false
            })
        } catch (error: any) {
            let message = files.length > 1 ? 'Error uploading images' : 'Error uploading image'
            updateNotification(notificationId, {
                message: `${message}: ${error.message}`,
                type: 'error',
                isLoading: false
            })
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

    const addTempImage = async (file: File, insertToEditor = false) => {
        if (!file) return

        return new Promise<void>((resolve, reject) => {
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

                if (insertToEditor) {
                    insertImageToEditor(newImage)
                }

                updateImageMap()
                resolve()
            }
            reader.onerror = (error) => reject(new Error(`Error reading file: ${error}`))
            reader.readAsDataURL(file)
        })
    }

    const insertImageToEditor = (image: MdImage) => {
        if (editorView.value) {
            try {
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

                updateImageMap()
            } catch (error: any) {
                showNotification(`Error inserting image: ${error.message}`, 'error')
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
        updateImageMap()

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