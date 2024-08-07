import {Ref} from 'vue'
import {EditorView} from '@codemirror/view'

export interface ToolbarAction {
    label: string
    action: () => void
    icon: any
}

export function useMdEditorToolbar(editorView: Ref<EditorView | null>) {
    const insertText = (before: string, after: string) => {
        if (!editorView.value) return

        const view = editorView.value as EditorView
        const selection = view.state.selection.main
        const insertedText = before + view.state.sliceDoc(selection.from, selection.to) + after

        view.dispatch({
            changes: {
                from: selection.from,
                to: selection.to,
                insert: insertedText
            },
            selection: {anchor: selection.from + before.length}
        })

        view.focus()
    }

    const toolbarActions: ToolbarAction[] = [
        {label: 'Bold', action: () => insertText('**', '**'), icon: 'BoldIcon'},
        {label: 'Italic', action: () => insertText('*', '*'), icon: 'ItalicIcon'},
        {label: 'Code', action: () => insertText('`', '`'), icon: 'CodeIcon'},
        {label: 'Link', action: () => insertText('[', '](url)'), icon: 'LinkIcon'},
        {label: 'Inline Equation', action: () => insertText('$', '$'), icon: 'TypeIcon'},
        {label: 'Block Equation', action: () => insertText('$$\n', '\n$$'), icon: 'FunctionSquareIcon'},
    ]

    return {
        toolbarActions,
        insertText
    }
}