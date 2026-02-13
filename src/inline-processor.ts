import type ChemistryPlugin from './main';
import { renderFormula } from './renderer';

export function registerInlineProcessor(plugin: ChemistryPlugin): void {
  plugin.registerMarkdownPostProcessor((el: HTMLElement) => {
    if (!plugin.settings.enableInlineRendering) return;

    const codeElements = el.querySelectorAll('code');

    codeElements.forEach((codeEl) => {
      const text = codeEl.textContent || '';
      if (!text.startsWith('chem:')) return;

      const chemText = text.substring(5).trim();
      if (!chemText) return;

      const wrapper = document.createElement('span');
      wrapper.className = 'chem-inline';

      try {
        renderFormula(chemText, wrapper);
        codeEl.replaceWith(wrapper);
      } catch (err) {
        // On error, leave the original <code> element unchanged
      }
    });
  });
}
