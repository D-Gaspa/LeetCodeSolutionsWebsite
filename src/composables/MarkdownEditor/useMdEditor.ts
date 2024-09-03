import {computed, onMounted, Ref, ref, watch} from 'vue'
import {markdown} from '@codemirror/lang-markdown'
import {EditorView} from '@codemirror/view'
import {Extension} from '@codemirror/state'
import MarkdownIt from 'markdown-it'
import MarkdownItKatex from '@vscode/markdown-it-katex'
import {oneDark} from "@codemirror/theme-one-dark"
import {isEqual} from "lodash"
import type {NotificationOptions, NotificationType} from "@/types/Notification"
import {MdContent, MdContentNoImages, MdImage} from "@/types/Problem"

export function useMdEditor(
    props: {
        initialContent: MdContent | MdContentNoImages
        modelValue: MdContent | MdContentNoImages
        enableImages: boolean
    },
    emit: (event: "update:modelValue", value: MdContent | MdContentNoImages) => void,
    theme: Ref<string>,
    showNotification: (
        message: string,
        type?: NotificationType,
        options?: NotificationOptions
    ) => number
) {
    const localContent = ref(props.initialContent.text || props.modelValue.text || '')
    const tempImages = ref<MdImage[]>([])
    const imageMap = ref(new Map())
    const editorView: Ref<EditorView | null> = ref(null)
    const editorKey = ref(0)

    const md = new MarkdownIt({
        html: true,
        linkify: true,
        typographer: true,
    }).use(MarkdownItKatex, {
        throwOnError: false,
        errorColor: '#cc0000',
        output: 'mathml',
    })

    const renderedContent = computed(() => md.render(localContent.value))

    const imageRenderer = computed(() => {
        return (tokens: any[], idx: number) => {
            if (!props.enableImages) return ''

            const token = tokens[idx]
            const srcIndex = token.attrIndex('src')
            let src = token.attrs[srcIndex][1]
            const alt = token.content || ''

            const matchingImage = imageMap.value.get(src) || tempImages.value.find(img => img.id === src || img.url === src)
            if (matchingImage) {
                src = matchingImage.url
            }

            return `<img src="${src}" alt="${alt}" style="max-width: 100%; width: 300px;">`
        }
    })

    const setupImageRenderer = () => {
        if (props.enableImages) {
            md.renderer.rules.image = imageRenderer.value
        }
    }

    const updateImageMap = () => {
        if (!props.enableImages) return

        imageMap.value.clear()
        tempImages.value.forEach(image => {
            imageMap.value.set(image.id, image)
            imageMap.value.set(image.url, image)
        })
    }

    const initializeContent = () => {
        try {
            localContent.value = props.initialContent.text || props.modelValue.text || ''
            if (props.enableImages) {
                tempImages.value = (props.initialContent.images || props.modelValue.images || []).map(img => ({
                    id: img.id || img.url,
                    name: img.name,
                    url: img.url,
                    file: img.file ?? null
                }))
                updateImageMap()
            } else {
                tempImages.value = []
                imageMap.value.clear()
            }
            setupImageRenderer()
        } catch (error) {
            showNotification(`Error initializing content: ${(error as Error).message}`, 'error')
        }
    }

    const extensions = computed((): Extension[] => [
        markdown(),
        EditorView.lineWrapping,
        theme.value === 'dark' ? oneDark : [],
    ])

    const handleReady = (payload: { view: EditorView }) => {
        editorView.value = payload.view
    }

    const clearContent = () => {
        localContent.value = ''
        emit('update:modelValue', props.enableImages ? {text: '', images: []} : {text: ''})
    }

    watch(() => props.initialContent, (newContent) => {
        if (newContent && (newContent.text !== localContent.value || (props.enableImages && !isEqual(newContent.images, tempImages.value)))) {
            initializeContent()
        }
    }, {deep: true})

    watch(imageRenderer, setupImageRenderer, {immediate: true})

    watch(() => props.modelValue.text, (newValue) => {
        if (newValue !== localContent.value) {
            localContent.value = newValue
        }
    })

    watch(theme, () => {
        // Force re-render of the Codemirror component
        editorKey.value += 1
    })

    onMounted(() => {
        // Set the editor for the first time
        editorKey.value += 1
    })

    return {
        localContent,
        tempImages,
        renderedContent,
        extensions,
        editorView,
        initializeContent,
        updateImageMap,
        handleReady,
        clearContent,
    }
}