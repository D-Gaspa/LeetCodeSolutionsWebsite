import {computed, ref} from 'vue'
import MarkdownIt from 'markdown-it'
import MarkdownItKatex from '@vscode/markdown-it-katex'
import hljs from 'highlight.js'

export interface MarkdownEditorContent {
    text: string
    images: Array<{
        id: string
        name: string
        url: string
        file?: File
    }>
}

export function useMdEditor(initialContent: MarkdownEditorContent) {
    const content = ref<MarkdownEditorContent>(initialContent)
    const showPreview = ref(true)

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

    const renderedContent = computed(() => {
        return md.render(content.value.text)
    })

    const updateContent = (newContent: MarkdownEditorContent) => {
        content.value = newContent
    }

    const togglePreview = () => {
        showPreview.value = !showPreview.value
    }

    const clearContent = () => {
        content.value = {text: '', images: []}
    }

    return {
        content,
        showPreview,
        renderedContent,
        updateContent,
        togglePreview,
        clearContent
    }
}