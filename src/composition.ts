import { parseFormula, getMolarMass } from './parser';
import { ELEMENT_MASSES } from './periodic-table';
import { renderFormula } from './renderer';
import type ChemistryPlugin from './main';

export function compositionAndDisplay(
  plugin: ChemistryPlugin,
  formula: string,
  container: HTMLElement
): void {
  try {
    const parsed = parseFormula(formula);
    const totalMass = getMolarMass(parsed.elements) * parsed.coefficient;
    const dp = plugin.settings.decimalPlaces;

    const resultDiv = container.createDiv({ cls: 'chem-result' });
    resultDiv.createEl('div', { cls: 'chem-label', text: 'Percent Composition:' });

    const headerDiv = resultDiv.createDiv({ cls: 'chem-result-header' });
    renderFormula(formula, headerDiv);
    headerDiv.createSpan({ text: ` \u2014 Molar mass: ${totalMass.toFixed(dp)} g/mol` });

    const table = resultDiv.createEl('table', { cls: 'chem-table' });
    const thead = table.createEl('thead');
    const headerRow = thead.createEl('tr');
    headerRow.createEl('th', { text: 'Element' });
    headerRow.createEl('th', { text: 'Count' });
    headerRow.createEl('th', { text: 'Mass (g/mol)' });
    headerRow.createEl('th', { text: 'Percent' });

    const tbody = table.createEl('tbody');
    let percentSum = 0;

    for (const [element, count] of Object.entries(parsed.elements)) {
      const elementMass = ELEMENT_MASSES[element];
      const totalCount = count * parsed.coefficient;
      const massContribution = totalCount * elementMass;
      const percent = (massContribution / totalMass) * 100;
      percentSum += percent;

      const row = tbody.createEl('tr');
      row.createEl('td', { text: element });
      row.createEl('td', { text: String(totalCount) });
      row.createEl('td', { text: massContribution.toFixed(dp) });
      row.createEl('td', { text: `${percent.toFixed(dp)}%` });
    }

    resultDiv.createDiv({
      cls: 'chem-info',
      text: `Verification: sum = ${percentSum.toFixed(dp)}%`
    });
  } catch (error) {
    container.createDiv({
      cls: 'chem-error',
      text: `Composition error: ${error instanceof Error ? error.message : String(error)}`
    });
  }
}
