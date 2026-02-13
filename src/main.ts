import { Editor, Plugin } from 'obsidian';
import { ChemistrySettingTab, ChemistryPluginSettings, DEFAULT_SETTINGS } from './settings';
import { processChemBlock } from './block-processor';
import { registerInlineProcessor } from './inline-processor';
import { chemTriggerExtension } from './editor-extension';

export default class ChemistryPlugin extends Plugin {
  settings: ChemistryPluginSettings;

  async onload() {
    await this.loadSettings();

    this.addSettingTab(new ChemistrySettingTab(this.app, this));

    this.registerMarkdownCodeBlockProcessor('chem', (source, el, ctx) => {
      processChemBlock(this, source, el, ctx);
    });

    registerInlineProcessor(this);

    // Register the $$$ trigger (typing $$$ auto-converts to a ```chem block)
    this.registerEditorExtension(chemTriggerExtension);

    // Command: Insert chemistry block
    this.addCommand({
      id: 'insert-chem-block',
      name: 'Insert chemistry block',
      editorCallback: (editor: Editor) => {
        const cursor = editor.getCursor();
        const block = '```chem\n\n```';
        editor.replaceRange(block, cursor);
        editor.setCursor({ line: cursor.line + 1, ch: 0 });
      },
    });

    // Command: Wrap selection as inline chemistry
    this.addCommand({
      id: 'insert-inline-chem',
      name: 'Insert inline chemistry',
      editorCallback: (editor: Editor) => {
        const selection = editor.getSelection();
        if (selection) {
          editor.replaceSelection('`chem:' + selection + '`');
        } else {
          const cursor = editor.getCursor();
          editor.replaceRange('`chem:`', cursor);
          editor.setCursor({ line: cursor.line, ch: cursor.ch + 6 });
        }
      },
    });
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  onunload() {
    // Obsidian handles deregistration automatically
  }
}
