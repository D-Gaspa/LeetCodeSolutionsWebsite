import {BoldIcon, CodeIcon, FunctionSquareIcon, ItalicIcon, LinkIcon, TypeIcon} from 'lucide-vue-next'
import {EditorView} from '@codemirror/view'
import {Ref} from "vue";

export interface ToolbarAction {
    label: string;
    icon: any;
    action: () => void;
}

export function useMdToolbar(editorView: Ref<EditorView | null>) {
    const toolbarActions: ToolbarAction[] = [
        {label: 'Bold', icon: BoldIcon, action: () => insertText('**', '**')},
        {label: 'Italic', icon: ItalicIcon, action: () => insertText('*', '*')},
        {label: 'Code', icon: CodeIcon, action: () => insertText('`', '`')},
        {label: 'Link', icon: LinkIcon, action: () => insertText('[', '](url)')},
        {label: 'Inline Equation', icon: TypeIcon, action: () => insertText('$', '$')},
        {label: 'Block Equation', icon: FunctionSquareIcon, action: () => insertText('$$\n', '\n$$')},
    ]

    const insertText = (before: string, after: string) => {
        if (editorView.value) {
            const {from, to} = editorView.value.state.selection.main
            editorView.value.dispatch({
                changes: {
                    from,
                    to,
                    insert: before + editorView.value.state.sliceDoc(from, to) + after,
                },
                selection: {anchor: from + before.length},
            })
            editorView.value.focus()
        }
    }

    return {
        toolbarActions,
        insertText
    }
}