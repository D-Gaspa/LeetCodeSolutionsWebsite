import {computed, onMounted, Ref, ref, watch} from 'vue'
import {markdown} from '@codemirror/lang-markdown'
import {EditorView} from '@codemirror/view'
import {Extension} from '@codemirror/state'
import MarkdownIt from 'markdown-it'
import MarkdownItKatex from '@vscode/markdown-it-katex'
import hljs from 'highlight.js'
import {MdImage} from "./useMdImageManagement";

export interface EditorContent {
    text: string;
    images: MdImage[];
}

export function useMdEditor(props: {
    initialContent: EditorContent;
    modelValue: EditorContent
}, emit: (event: 'update:modelValue', value: EditorContent) => void) {
    const localContent = ref(props.initialContent.text || props.modelValue.text || '')
    const editorView: Ref<EditorView | null> = ref(null)
    const editorKey = ref(0)

    const md = new MarkdownIt({
        html: true,
        linkify: true,
        typographer: true,
        highlight: function (str, lang) {
            if (lang && hljs.getLanguage(lang)) {
                try {
                    return hljs.highlight(str, {language: lang}).value
                } catch (__) {
                }
            }
            return '' // use external default escaping
        }
    }).use(MarkdownItKatex)

    const renderedContent = computed(() => md.render(localContent.value))

    const extensions = computed((): Extension[] => [
        markdown(),
        EditorView.lineWrapping,
    ])

    const handleReady = (payload: { view: EditorView; state: any }) => {
        editorView.value = payload.view
    }

    const handleContentUpdate = (newContent: string) => {
        localContent.value = newContent
        emit('update:modelValue', {
            text: newContent,
            images: props.modelValue.images
        })
    }

    const clearContent = () => {
        localContent.value = ''
        emit('update:modelValue', {text: '', images: []})
    }

    watch(() => props.modelValue.text, (newValue) => {
        if (newValue !== localContent.value) {
            localContent.value = newValue
        }
    })

    onMounted(() => {
        // Set the editor for the first time
        editorKey.value += 1
    })

    return {
        localContent,
        renderedContent,
        extensions,
        editorView,
        editorKey,
        handleReady,
        handleContentUpdate,
        clearContent,
    }
}