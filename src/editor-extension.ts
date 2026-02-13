import { EditorView } from '@codemirror/view';

// When the user types '$$$' at the start of a line, auto-convert it into a ```chem block.
// The inputHandler intercepts the third '$' BEFORE it's applied to the document,
// so Obsidian's math mode never sees '$$$'.
export const chemTriggerExtension = EditorView.inputHandler.of(
  (view, from, to, text) => {
    if (text !== '$') return false;

    const line = view.state.doc.lineAt(from);
    const beforeCursor = view.state.sliceDoc(line.from, from);

    // Check if typing this '$' would create '$$$' at the start of a line
    if (beforeCursor.trimStart() === '$$') {
      const indent = beforeCursor.match(/^(\s*)/)?.[1] || '';
      const block = `\`\`\`chem\n${indent}\n${indent}\`\`\``;
      const cursorPos = line.from + indent.length + 8; // position after ```chem\n

      view.dispatch({
        changes: { from: line.from, to, insert: block },
        selection: { anchor: cursorPos },
      });
      return true;
    }

    return false;
  }
);
