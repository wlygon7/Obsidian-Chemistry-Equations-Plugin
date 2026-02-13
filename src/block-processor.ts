import { MarkdownPostProcessorContext } from 'obsidian';
import type ChemistryPlugin from './main';
import { renderEquation, renderFormula } from './renderer';
import { calculateAndDisplayMolarMass, convertAndDisplay } from './calculator';
import { balanceAndDisplay } from './balancer';
import { solveAndDisplayStoichiometry } from './stoichiometry';

export function processChemBlock(
  plugin: ChemistryPlugin,
  source: string,
  el: HTMLElement,
  ctx: MarkdownPostProcessorContext
): void {
  const lines = source.trim().split('\n');
  const container = el.createDiv({ cls: 'chem-block' });

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    try {
      if (trimmed.startsWith('molar:') || trimmed.startsWith('calc:')) {
        const formula = trimmed.replace(/^(molar|calc):/, '').trim();
        calculateAndDisplayMolarMass(plugin, formula, container);
      } else if (trimmed.startsWith('balance:')) {
        const equation = trimmed.substring(8).trim();
        balanceAndDisplay(plugin, equation, container);
      } else if (trimmed.startsWith('convert:')) {
        const input = trimmed.substring(8).trim();
        convertAndDisplay(plugin, input, container);
      } else if (trimmed.startsWith('stoich:')) {
        const input = trimmed.substring(7).trim();
        solveAndDisplayStoichiometry(plugin, input, container);
      } else {
        // Default: render beautifully
        if (trimmed.includes('->') || trimmed.includes('<->') || trimmed.includes('<=>')) {
          renderEquation(trimmed, container);
        } else {
          renderFormula(trimmed, container);
        }
      }
    } catch (err) {
      container.createDiv({
        cls: 'chem-error',
        text: `Error: ${err instanceof Error ? err.message : String(err)}`
      });
    }
  }
}
