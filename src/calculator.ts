import { parseFormula, getMolarMass } from './parser';
import { ELEMENT_MASSES } from './periodic-table';
import { renderFormula } from './renderer';
import type ChemistryPlugin from './main';

export function calculateAndDisplayMolarMass(
  plugin: ChemistryPlugin,
  formula: string,
  container: HTMLElement
): void {
  try {
    const parsed = parseFormula(formula);
    const mass = getMolarMass(parsed.elements) * parsed.coefficient;
    const dp = plugin.settings.decimalPlaces;

    const resultDiv = container.createDiv({ cls: 'chem-result' });

    const headerDiv = resultDiv.createDiv({ cls: 'chem-result-header' });
    renderFormula(formula, headerDiv);
    headerDiv.createSpan({ text: ` \u2192 Molar Mass: ${mass.toFixed(dp)} g/mol` });

    if (plugin.settings.showElementBreakdown) {
      const breakdown = resultDiv.createDiv({ cls: 'chem-breakdown' });
      for (const [element, count] of Object.entries(parsed.elements)) {
        const elementMass = ELEMENT_MASSES[element];
        const totalCount = count * parsed.coefficient;
        breakdown.createEl('div', {
          text: `${element}: ${totalCount} \u00D7 ${elementMass} = ${(totalCount * elementMass).toFixed(dp)} g/mol`
        });
      }
    }
  } catch (error) {
    container.createDiv({
      cls: 'chem-error',
      text: `Error: ${error instanceof Error ? error.message : String(error)}`
    });
  }
}

export function convertAndDisplay(
  plugin: ChemistryPlugin,
  input: string,
  container: HTMLElement
): void {
  try {
    // Parse: "5g H2O to mol" or "2mol NaCl to g"
    const match = input.match(/^([\d.]+)\s*(g|mol)\s+(\S+)\s+to\s+(g|mol)$/i);
    if (!match) {
      throw new Error('Format: 5g H2O to mol  or  2mol NaCl to g');
    }

    const value = parseFloat(match[1]);
    const fromUnit = match[2].toLowerCase();
    const formula = match[3];
    const toUnit = match[4].toLowerCase();
    const dp = plugin.settings.decimalPlaces;

    const parsed = parseFormula(formula);
    const molarMass = getMolarMass(parsed.elements);

    let result: number;
    let resultText: string;

    if (fromUnit === 'g' && toUnit === 'mol') {
      result = value / molarMass;
      resultText = `${value}g ${formula} = ${result.toFixed(dp)} mol`;
    } else if (fromUnit === 'mol' && toUnit === 'g') {
      result = value * molarMass;
      resultText = `${value} mol ${formula} = ${result.toFixed(dp)} g`;
    } else {
      throw new Error('Can only convert between g and mol');
    }

    const resultDiv = container.createDiv({ cls: 'chem-result' });
    resultDiv.createSpan({ text: resultText });
    resultDiv.createDiv({
      cls: 'chem-info',
      text: `Molar mass of ${formula}: ${molarMass.toFixed(dp)} g/mol`
    });
  } catch (error) {
    container.createDiv({
      cls: 'chem-error',
      text: `Conversion error: ${error instanceof Error ? error.message : String(error)}`
    });
  }
}
