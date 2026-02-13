import { parseEquation, parseFormula, getMolarMass, findCompound } from './parser';
import { renderEquation } from './renderer';
import type ChemistryPlugin from './main';

export function limitingReagentAndDisplay(
  plugin: ChemistryPlugin,
  input: string,
  container: HTMLElement
): void {
  try {
    const pipeIndex = input.indexOf('|');
    if (pipeIndex === -1) {
      throw new Error('Format: equation | 5g H2, 10g O2');
    }

    const equationStr = input.substring(0, pipeIndex).trim();
    const amountsStr = input.substring(pipeIndex + 1).trim();
    const eq = parseEquation(equationStr);
    const dp = plugin.settings.decimalPlaces;

    // Parse comma-separated amounts: "5g H2, 10g O2"
    const amountParts = amountsStr.split(',').map(s => s.trim());
    const amounts: Array<{ value: number; unit: 'g' | 'mol'; formulaStr: string }> = [];

    for (const part of amountParts) {
      const match = part.match(/^([\d.]+)\s*(g|mol)\s+(\S+)$/i);
      if (!match) throw new Error(`Cannot parse amount: "${part}". Format: 5g H2`);
      amounts.push({
        value: parseFloat(match[1]),
        unit: match[2].toLowerCase() as 'g' | 'mol',
        formulaStr: match[3]
      });
    }

    if (amounts.length < 2) {
      throw new Error('Provide at least 2 reactant amounts separated by commas');
    }

    // Calculate moles and ratio for each reactant
    const analysis = amounts.map(a => {
      const compound = findCompound(eq.reactants, a.formulaStr);
      if (!compound) throw new Error(`${a.formulaStr} is not a reactant in the equation`);

      const molarMass = getMolarMass(compound.elements);
      const moles = a.unit === 'g' ? a.value / molarMass : a.value;
      const ratio = moles / compound.coefficient;

      return { ...a, compound, molarMass, moles, ratio };
    });

    // Find limiting reagent (smallest ratio)
    const limitingIndex = analysis.reduce((minIdx, curr, idx, arr) =>
      curr.ratio < arr[minIdx].ratio ? idx : minIdx, 0);
    const limiting = analysis[limitingIndex];

    // Display
    const resultDiv = container.createDiv({ cls: 'chem-result' });
    resultDiv.createEl('div', { cls: 'chem-label', text: 'Limiting Reagent Analysis:' });
    renderEquation(equationStr, resultDiv);

    // Reactant table
    const table = resultDiv.createEl('table', { cls: 'chem-table' });
    const thead = table.createEl('thead');
    const headerRow = thead.createEl('tr');
    headerRow.createEl('th', { text: 'Reactant' });
    headerRow.createEl('th', { text: 'Given' });
    headerRow.createEl('th', { text: 'Moles' });
    headerRow.createEl('th', { text: '\u00F7 Coefficient' });
    headerRow.createEl('th', { text: 'Ratio' });

    const tbody = table.createEl('tbody');
    analysis.forEach((a, i) => {
      const row = tbody.createEl('tr');
      if (i === limitingIndex) row.addClass('chem-limiting-row');
      row.createEl('td', { text: a.formulaStr });
      row.createEl('td', { text: `${a.value} ${a.unit}` });
      row.createEl('td', { text: a.moles.toFixed(dp) });
      row.createEl('td', { text: `\u00F7 ${a.compound.coefficient}` });
      row.createEl('td', { text: a.ratio.toFixed(dp) });
    });

    resultDiv.createDiv({
      cls: 'chem-answer',
      text: `Limiting reagent: ${limiting.formulaStr}`
    });

    // Products formed
    if (plugin.settings.showCalculationSteps) {
      const stepsDiv = resultDiv.createDiv({ cls: 'chem-steps' });
      stepsDiv.createEl('div', { text: 'Products formed:' });

      for (const product of eq.products) {
        const productMoles = limiting.moles * (product.coefficient / limiting.compound.coefficient);
        const productMass = productMoles * getMolarMass(product.elements);
        stepsDiv.createEl('div', {
          text: `  ${product.original}: ${productMoles.toFixed(dp)} mol = ${productMass.toFixed(dp)} g`
        });
      }

      // Excess reagents
      stepsDiv.createEl('div', { text: 'Excess reagents remaining:' });
      analysis.forEach((a, i) => {
        if (i === limitingIndex) return;
        const molesUsed = limiting.moles * (a.compound.coefficient / limiting.compound.coefficient);
        const molesRemaining = a.moles - molesUsed;
        const massRemaining = molesRemaining * a.molarMass;
        stepsDiv.createEl('div', {
          text: `  ${a.formulaStr}: ${molesUsed.toFixed(dp)} mol used, ${molesRemaining.toFixed(dp)} mol remaining (${massRemaining.toFixed(dp)} g)`
        });
      });
    }
  } catch (error) {
    container.createDiv({
      cls: 'chem-error',
      text: `Limiting reagent error: ${error instanceof Error ? error.message : String(error)}`
    });
  }
}
