import {computed, onMounted, Ref, ref, watch} from 'vue'
import {markdown} from '@codemirror/lang-markdown'
import {EditorView} from '@codemirror/view'
import {Extension} from '@codemirror/state'
import MarkdownIt from 'markdown-it'
import MarkdownItKatex from '@vscode/markdown-it-katex'
import {oneDark} from "@codemirror/theme-one-dark"
import {isEqual} from "lodash"
import type {NotificationOptions, NotificationType} from "@/types/Notification";
import {MdImage, ProblemContent} from "@/types/Problem";

export function useMdEditor(props: {
    initialContent: ProblemContent
    modelValue: ProblemContent
}, emit: (event: "update:modelValue", value: ProblemContent)
    => void, theme: Ref<string>, showNotification: (message: string, type?: NotificationType, options?: NotificationOptions) => number) {
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
        output: 'mathml', // Force MathML output
    });

    const renderedContent = computed(() => md.render(localContent.value))

    const imageRenderer = computed(() => {
        return (tokens: any[], idx: number) => {
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
        md.renderer.rules.image = imageRenderer.value
    }

    const updateImageMap = () => {
        imageMap.value.clear()

        tempImages.value.forEach(image => {
            imageMap.value.set(image.id, image)
            imageMap.value.set(image.url, image)
        })
    }

    const initializeContent = () => {
        try {
            localContent.value = props.initialContent.text || props.modelValue.text || ''
            tempImages.value = (props.initialContent.images || props.modelValue.images || []).map(img => ({
                id: img.id || img.url,
                name: img.name,
                url: img.url,
                file: img.file ?? null // Preserve the file object for new images, null for existing ones
            }))

            updateImageMap()
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

    const handleReady = (payload: { view: EditorView; state: any }) => {
        editorView.value = payload.view
    }

    const clearContent = () => {
        localContent.value = ''
        emit('update:modelValue', {text: '', images: []})
    }

    watch(() => props.initialContent, (newContent) => {
        if (newContent && (newContent.text !== localContent.value || !isEqual(newContent.images, tempImages.value))) {
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