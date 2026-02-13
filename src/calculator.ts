import { parseFormula, getMolarMass } from './parser';
import { ELEMENT_MASSES } from './periodic-table';
import { renderFormula } from './renderer';
import { AVOGADRO, MOLAR_VOLUME_STP } from './constants';
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

type ConvertUnit = 'g' | 'mol' | 'l' | 'particles';

function toMoles(value: number, fromUnit: ConvertUnit, molarMass: number): { moles: number; step: string } {
  switch (fromUnit) {
    case 'g':
      return { moles: value / molarMass, step: `${value} g \u00F7 ${molarMass.toFixed(4)} g/mol = ${(value / molarMass).toFixed(4)} mol` };
    case 'mol':
      return { moles: value, step: `${value} mol (given)` };
    case 'l':
      return { moles: value / MOLAR_VOLUME_STP, step: `${value} L \u00F7 ${MOLAR_VOLUME_STP} L/mol = ${(value / MOLAR_VOLUME_STP).toFixed(4)} mol (at STP)` };
    case 'particles':
      return { moles: value / AVOGADRO, step: `${value.toExponential(3)} particles \u00F7 ${AVOGADRO.toExponential(3)} = ${(value / AVOGADRO).toFixed(4)} mol` };
  }
}

function fromMoles(moles: number, toUnit: ConvertUnit, molarMass: number): { value: number; step: string } {
  switch (toUnit) {
    case 'g':
      return { value: moles * molarMass, step: `${moles.toFixed(4)} mol \u00D7 ${molarMass.toFixed(4)} g/mol = ${(moles * molarMass).toFixed(4)} g` };
    case 'mol':
      return { value: moles, step: `${moles.toFixed(4)} mol` };
    case 'l':
      return { value: moles * MOLAR_VOLUME_STP, step: `${moles.toFixed(4)} mol \u00D7 ${MOLAR_VOLUME_STP} L/mol = ${(moles * MOLAR_VOLUME_STP).toFixed(4)} L (at STP)` };
    case 'particles':
      return { value: moles * AVOGADRO, step: `${moles.toFixed(4)} mol \u00D7 ${AVOGADRO.toExponential(3)} = ${(moles * AVOGADRO).toExponential(3)} particles` };
  }
}

function normalizeUnit(unit: string): ConvertUnit {
  const u = unit.toLowerCase();
  if (u === 'g') return 'g';
  if (u === 'mol') return 'mol';
  if (u === 'l') return 'l';
  if (u === 'particles') return 'particles';
  throw new Error(`Unknown unit: ${unit}. Supported: g, mol, L, particles`);
}

export function convertAndDisplay(
  plugin: ChemistryPlugin,
  input: string,
  container: HTMLElement
): void {
  try {
    const dp = plugin.settings.decimalPlaces;

    // Try molarity format: "0.5M 2L NaCl to g"
    const molarityMatch = input.match(/^([\d.]+)M\s+([\d.]+)\s*(L|mL)\s+(\S+)\s+to\s+(g|mol|particles)$/i);
    if (molarityMatch) {
      const molarity = parseFloat(molarityMatch[1]);
      let volume = parseFloat(molarityMatch[2]);
      const volUnit = molarityMatch[3].toLowerCase();
      const formula = molarityMatch[4];
      const toUnit = normalizeUnit(molarityMatch[5]);

      if (volUnit === 'ml') volume /= 1000;

      const parsed = parseFormula(formula);
      const molarMass = getMolarMass(parsed.elements);
      const moles = molarity * volume;
      const { value: result, step: convStep } = fromMoles(moles, toUnit, molarMass);

      const resultDiv = container.createDiv({ cls: 'chem-result' });
      resultDiv.createEl('div', { cls: 'chem-label', text: 'Unit Conversion:' });

      if (plugin.settings.showCalculationSteps) {
        const stepsDiv = resultDiv.createDiv({ cls: 'chem-steps' });
        stepsDiv.createEl('div', { text: `Moles: ${molarity} M \u00D7 ${volume} L = ${moles.toFixed(dp)} mol ${formula}` });
        if (toUnit !== 'mol') {
          stepsDiv.createEl('div', { text: convStep });
        }
      }

      const display = toUnit === 'particles' ? result.toExponential(dp) : result.toFixed(dp);
      resultDiv.createDiv({
        cls: 'chem-answer',
        text: `${molarity}M \u00D7 ${volume}L ${formula} = ${display} ${toUnit}`
      });
      return;
    }

    // Standard format: "5g H2O to mol"
    const match = input.match(/^([\d.eE+-]+)\s*(g|mol|L|particles)\s+(\S+)\s+to\s+(g|mol|L|particles)$/i);
    if (!match) {
      throw new Error('Format: 5g H2O to mol, 2mol O2 to L, 5g H2O to particles, or 0.5M 2L NaCl to g');
    }

    const value = parseFloat(match[1]);
    const fromUnit = normalizeUnit(match[2]);
    const formula = match[3];
    const toUnit = normalizeUnit(match[4]);

    if (fromUnit === toUnit) {
      throw new Error(`Cannot convert ${fromUnit} to ${toUnit} (same unit)`);
    }

    const parsed = parseFormula(formula);
    const molarMass = getMolarMass(parsed.elements);

    const { moles, step: toMolStep } = toMoles(value, fromUnit, molarMass);
    const { value: result, step: fromMolStep } = fromMoles(moles, toUnit, molarMass);

    const resultDiv = container.createDiv({ cls: 'chem-result' });
    resultDiv.createEl('div', { cls: 'chem-label', text: 'Unit Conversion:' });

    if (plugin.settings.showCalculationSteps) {
      const stepsDiv = resultDiv.createDiv({ cls: 'chem-steps' });
      if (fromUnit !== 'mol') {
        stepsDiv.createEl('div', { text: `To moles: ${toMolStep}` });
      }
      if (toUnit !== 'mol') {
        stepsDiv.createEl('div', { text: `From moles: ${fromMolStep}` });
      }
    }

    const fromDisplay = fromUnit === 'particles' ? value.toExponential(dp) : String(value);
    const toDisplay = toUnit === 'particles' ? result.toExponential(dp) : result.toFixed(dp);
    resultDiv.createDiv({
      cls: 'chem-answer',
      text: `${fromDisplay} ${fromUnit} ${formula} = ${toDisplay} ${toUnit}`
    });

    const notes: string[] = [];
    notes.push(`Molar mass of ${formula}: ${molarMass.toFixed(dp)} g/mol`);
    if (fromUnit === 'l' || toUnit === 'l') {
      notes.push('Volume calculated at STP (0\u00B0C, 1 atm)');
    }
    resultDiv.createDiv({ cls: 'chem-info', text: notes.join(' | ') });
  } catch (error) {
    container.createDiv({
      cls: 'chem-error',
      text: `Conversion error: ${error instanceof Error ? error.message : String(error)}`
    });
  }
}
