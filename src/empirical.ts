import { getMolarMass } from './parser';
import { ELEMENT_MASSES } from './periodic-table';
import { renderFormula } from './renderer';
import type ChemistryPlugin from './main';

interface ElementPercent {
  element: string;
  percent: number;
}

function parsePercentComposition(input: string): ElementPercent[] {
  const results: ElementPercent[] = [];
  const regex = /([A-Z][a-z]?)\s+([\d.]+)%?/g;
  let match;

  while ((match = regex.exec(input)) !== null) {
    const element = match[1];
    if (!(element in ELEMENT_MASSES)) {
      throw new Error(`Unknown element: ${element}`);
    }
    results.push({ element, percent: parseFloat(match[2]) });
  }

  if (results.length === 0) {
    throw new Error('Format: C 40% H 6.7% O 53.3%');
  }
  return results;
}

function computeEmpiricalFormula(data: ElementPercent[]): Record<string, number> {
  // Convert percentages to moles
  const moles = data.map(d => ({
    element: d.element,
    moles: d.percent / ELEMENT_MASSES[d.element]
  }));

  // Divide by smallest
  const minMoles = Math.min(...moles.map(m => m.moles));
  if (minMoles <= 0) throw new Error('All percentages must be greater than zero');

  const ratios = moles.map(m => ({
    element: m.element,
    ratio: m.moles / minMoles
  }));

  // Detect common fractions and find multiplier
  let multiplier = 1;
  for (const r of ratios) {
    const frac = r.ratio - Math.floor(r.ratio);
    if (frac > 0.1 && frac < 0.9) {
      if (Math.abs(frac - 0.5) < 0.15) { multiplier = Math.max(multiplier, 2); }
      else if (Math.abs(frac - 0.333) < 0.15 || Math.abs(frac - 0.667) < 0.15) { multiplier = Math.max(multiplier, 3); }
      else if (Math.abs(frac - 0.25) < 0.15 || Math.abs(frac - 0.75) < 0.15) { multiplier = Math.max(multiplier, 4); }
    }
  }

  const result: Record<string, number> = {};
  for (const r of ratios) {
    result[r.element] = Math.round(r.ratio * multiplier);
  }
  return result;
}

function formulaFromElements(elements: Record<string, number>): string {
  return Object.entries(elements)
    .map(([el, count]) => count === 1 ? el : `${el}${count}`)
    .join('');
}

export function empiricalAndDisplay(
  plugin: ChemistryPlugin,
  input: string,
  container: HTMLElement
): void {
  try {
    const data = parsePercentComposition(input);
    const dp = plugin.settings.decimalPlaces;

    const resultDiv = container.createDiv({ cls: 'chem-result' });
    resultDiv.createEl('div', { cls: 'chem-label', text: 'Empirical Formula:' });

    // Show work table
    if (plugin.settings.showCalculationSteps) {
      const table = resultDiv.createEl('table', { cls: 'chem-table' });
      const thead = table.createEl('thead');
      const headerRow = thead.createEl('tr');
      headerRow.createEl('th', { text: 'Element' });
      headerRow.createEl('th', { text: '% Mass' });
      headerRow.createEl('th', { text: '\u00F7 Atomic Mass' });
      headerRow.createEl('th', { text: 'Mole Ratio' });

      const tbody = table.createEl('tbody');
      const moles = data.map(d => d.percent / ELEMENT_MASSES[d.element]);
      const minMoles = Math.min(...moles);

      data.forEach((d, i) => {
        const row = tbody.createEl('tr');
        row.createEl('td', { text: d.element });
        row.createEl('td', { text: `${d.percent}%` });
        row.createEl('td', { text: `${d.percent} \u00F7 ${ELEMENT_MASSES[d.element].toFixed(dp)} = ${moles[i].toFixed(dp)}` });
        row.createEl('td', { text: (moles[i] / minMoles).toFixed(dp) });
      });
    }

    const elements = computeEmpiricalFormula(data);
    const formulaStr = formulaFromElements(elements);

    const answerDiv = resultDiv.createDiv({ cls: 'chem-answer' });
    answerDiv.createSpan({ text: 'Empirical formula: ' });
    renderFormula(formulaStr, answerDiv);

    const mass = getMolarMass(elements);
    resultDiv.createDiv({
      cls: 'chem-info',
      text: `Empirical formula mass: ${mass.toFixed(dp)} g/mol`
    });
  } catch (error) {
    container.createDiv({
      cls: 'chem-error',
      text: `Empirical formula error: ${error instanceof Error ? error.message : String(error)}`
    });
  }
}

export function molecularAndDisplay(
  plugin: ChemistryPlugin,
  input: string,
  container: HTMLElement
): void {
  try {
    const pipeIndex = input.indexOf('|');
    if (pipeIndex === -1) {
      throw new Error('Format: C 40% H 6.7% O 53.3% | 180');
    }

    const compStr = input.substring(0, pipeIndex).trim();
    const givenMass = parseFloat(input.substring(pipeIndex + 1).trim());
    if (isNaN(givenMass) || givenMass <= 0) {
      throw new Error('Molar mass must be a positive number');
    }

    const data = parsePercentComposition(compStr);
    const empiricalElements = computeEmpiricalFormula(data);
    const empiricalMass = getMolarMass(empiricalElements);
    const dp = plugin.settings.decimalPlaces;

    const n = Math.round(givenMass / empiricalMass);
    if (n < 1) throw new Error('Given molar mass is less than empirical formula mass');

    const molecularElements: Record<string, number> = {};
    for (const [el, count] of Object.entries(empiricalElements)) {
      molecularElements[el] = count * n;
    }

    const empiricalStr = formulaFromElements(empiricalElements);
    const molecularStr = formulaFromElements(molecularElements);

    const resultDiv = container.createDiv({ cls: 'chem-result' });
    resultDiv.createEl('div', { cls: 'chem-label', text: 'Molecular Formula:' });

    if (plugin.settings.showCalculationSteps) {
      const stepsDiv = resultDiv.createDiv({ cls: 'chem-steps' });

      const empLine = stepsDiv.createEl('div');
      empLine.createSpan({ text: 'Empirical formula: ' });
      renderFormula(empiricalStr, empLine);

      stepsDiv.createEl('div', {
        text: `Empirical formula mass: ${empiricalMass.toFixed(dp)} g/mol`
      });
      stepsDiv.createEl('div', {
        text: `n = ${givenMass} \u00F7 ${empiricalMass.toFixed(dp)} = ${(givenMass / empiricalMass).toFixed(2)} \u2248 ${n}`
      });
    }

    const answerDiv = resultDiv.createDiv({ cls: 'chem-answer' });
    answerDiv.createSpan({ text: 'Molecular formula: ' });
    renderFormula(molecularStr, answerDiv);

    resultDiv.createDiv({
      cls: 'chem-info',
      text: `Molecular mass: ${getMolarMass(molecularElements).toFixed(dp)} g/mol`
    });
  } catch (error) {
    container.createDiv({
      cls: 'chem-error',
      text: `Molecular formula error: ${error instanceof Error ? error.message : String(error)}`
    });
  }
}
