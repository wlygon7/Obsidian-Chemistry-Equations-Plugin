import { parseFormula, getMolarMass } from './parser';
import type ChemistryPlugin from './main';

export function molarityAndDisplay(
  plugin: ChemistryPlugin,
  input: string,
  container: HTMLElement
): void {
  try {
    const dp = plugin.settings.decimalPlaces;

    // Format: "0.5mol NaCl in 2L" or "5.85g NaCl in 500mL"
    const match = input.match(/^([\d.]+)\s*(mol|g)\s+(\S+)\s+in\s+([\d.]+)\s*(L|mL)$/i);
    if (!match) {
      throw new Error('Format: 0.5mol NaCl in 2L  or  5.85g NaCl in 500mL');
    }

    const value = parseFloat(match[1]);
    const unit = match[2].toLowerCase();
    const formula = match[3];
    let volume = parseFloat(match[4]);
    const volUnit = match[5].toLowerCase();

    if (volUnit === 'ml') volume /= 1000;
    if (volume <= 0) throw new Error('Volume must be greater than zero');

    const parsed = parseFormula(formula);
    const molarMass = getMolarMass(parsed.elements);

    let moles: number;
    if (unit === 'g') {
      moles = value / molarMass;
    } else {
      moles = value;
    }

    const molarity = moles / volume;

    const resultDiv = container.createDiv({ cls: 'chem-result' });
    resultDiv.createEl('div', { cls: 'chem-label', text: 'Molarity Calculation:' });

    if (plugin.settings.showCalculationSteps) {
      const stepsDiv = resultDiv.createDiv({ cls: 'chem-steps' });
      if (unit === 'g') {
        stepsDiv.createEl('div', {
          text: `Moles: ${value}g ${formula} \u00F7 ${molarMass.toFixed(dp)} g/mol = ${moles.toFixed(dp)} mol`
        });
      }
      stepsDiv.createEl('div', {
        text: `M = n/V = ${moles.toFixed(dp)} mol \u00F7 ${volume} L`
      });
    }

    resultDiv.createDiv({
      cls: 'chem-answer',
      text: `Concentration: ${molarity.toFixed(dp)} M`
    });
  } catch (error) {
    container.createDiv({
      cls: 'chem-error',
      text: `Molarity error: ${error instanceof Error ? error.message : String(error)}`
    });
  }
}

export function dilutionAndDisplay(
  plugin: ChemistryPlugin,
  input: string,
  container: HTMLElement
): void {
  try {
    const dp = plugin.settings.decimalPlaces;

    // Format: "1M 0.5L to 2L"
    const match = input.match(/^([\d.]+)M\s+([\d.]+)\s*(L|mL)\s+to\s+([\d.]+)\s*(L|mL)$/i);
    if (!match) {
      throw new Error('Format: 1M 0.5L to 2L');
    }

    const m1 = parseFloat(match[1]);
    let v1 = parseFloat(match[2]);
    const v1Unit = match[3].toLowerCase();
    let v2 = parseFloat(match[4]);
    const v2Unit = match[5].toLowerCase();

    if (v1Unit === 'ml') v1 /= 1000;
    if (v2Unit === 'ml') v2 /= 1000;
    if (v2 <= 0) throw new Error('Final volume must be greater than zero');

    const m2 = (m1 * v1) / v2;

    const resultDiv = container.createDiv({ cls: 'chem-result' });
    resultDiv.createEl('div', { cls: 'chem-label', text: 'Dilution (M\u2081V\u2081 = M\u2082V\u2082):' });

    if (plugin.settings.showCalculationSteps) {
      const stepsDiv = resultDiv.createDiv({ cls: 'chem-steps' });
      stepsDiv.createEl('div', { text: `M\u2081 = ${m1} M, V\u2081 = ${v1} L` });
      stepsDiv.createEl('div', { text: `V\u2082 = ${v2} L` });
      stepsDiv.createEl('div', {
        text: `M\u2082 = M\u2081V\u2081 / V\u2082 = (${m1} \u00D7 ${v1}) / ${v2}`
      });
    }

    resultDiv.createDiv({
      cls: 'chem-answer',
      text: `Final concentration: ${m2.toFixed(dp)} M`
    });
  } catch (error) {
    container.createDiv({
      cls: 'chem-error',
      text: `Dilution error: ${error instanceof Error ? error.message : String(error)}`
    });
  }
}
