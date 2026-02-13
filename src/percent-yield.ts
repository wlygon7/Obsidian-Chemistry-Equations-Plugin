import { parseEquation, getMolarMass, findCompound } from './parser';
import { renderEquation } from './renderer';
import type ChemistryPlugin from './main';

export function percentYieldAndDisplay(
  plugin: ChemistryPlugin,
  input: string,
  container: HTMLElement
): void {
  try {
    const dp = plugin.settings.decimalPlaces;

    // Mode A (simple): "actual 5g, theoretical 9g"
    const simpleMatch = input.match(/^actual\s+([\d.]+)\s*(g|mol),?\s*theoretical\s+([\d.]+)\s*(g|mol)$/i);
    if (simpleMatch) {
      const actual = parseFloat(simpleMatch[1]);
      const actualUnit = simpleMatch[2].toLowerCase();
      const theoretical = parseFloat(simpleMatch[3]);
      const theoreticalUnit = simpleMatch[4].toLowerCase();

      if (actualUnit !== theoreticalUnit) {
        throw new Error('Actual and theoretical must have the same unit');
      }
      if (theoretical <= 0) throw new Error('Theoretical yield must be greater than zero');

      const percentYield = (actual / theoretical) * 100;

      const resultDiv = container.createDiv({ cls: 'chem-result' });
      resultDiv.createEl('div', { cls: 'chem-label', text: 'Percent Yield:' });

      if (plugin.settings.showCalculationSteps) {
        const stepsDiv = resultDiv.createDiv({ cls: 'chem-steps' });
        stepsDiv.createEl('div', { text: `Actual yield: ${actual} ${actualUnit}` });
        stepsDiv.createEl('div', { text: `Theoretical yield: ${theoretical} ${theoreticalUnit}` });
        stepsDiv.createEl('div', { text: `% Yield = (${actual} \u00F7 ${theoretical}) \u00D7 100` });
      }

      resultDiv.createDiv({
        cls: 'chem-answer',
        text: `Percent Yield: ${percentYield.toFixed(dp)}%`
      });

      if (percentYield > 100) {
        resultDiv.createDiv({
          cls: 'chem-info',
          text: 'Note: Yield > 100% typically indicates measurement error or impurities'
        });
      }
      return;
    }

    // Mode B (equation): "equation | 5g H2 -> 4g H2O"
    const pipeIndex = input.indexOf('|');
    if (pipeIndex === -1) {
      throw new Error('Format: actual 5g, theoretical 9g  OR  equation | 5g H2 -> 4g H2O');
    }

    const equationStr = input.substring(0, pipeIndex).trim();
    const problemStr = input.substring(pipeIndex + 1).trim();

    const eq = parseEquation(equationStr);

    // Parse: "5g H2 -> 4g H2O"
    const problemMatch = problemStr.match(
      /^([\d.]+)\s*(g|mol)\s+(\S+)\s*->\s*([\d.]+)\s*(g|mol)\s+(\S+)$/
    );
    if (!problemMatch) {
      throw new Error('Problem format: 5g H2 -> 4g H2O');
    }

    const knownValue = parseFloat(problemMatch[1]);
    const knownUnit = problemMatch[2] as 'g' | 'mol';
    const knownFormulaStr = problemMatch[3];
    const actualProductValue = parseFloat(problemMatch[4]);
    const actualProductUnit = problemMatch[5] as 'g' | 'mol';
    const productFormulaStr = problemMatch[6];

    const allCompounds = [...eq.reactants, ...eq.products];
    const knownCompound = findCompound(allCompounds, knownFormulaStr);
    const productCompound = findCompound(allCompounds, productFormulaStr);

    if (!knownCompound) throw new Error(`Could not find ${knownFormulaStr} in the equation`);
    if (!productCompound) throw new Error(`Could not find ${productFormulaStr} in the equation`);

    const knownMolarMass = getMolarMass(knownCompound.elements);
    const productMolarMass = getMolarMass(productCompound.elements);

    // Calculate theoretical yield
    const knownMoles = knownUnit === 'g' ? knownValue / knownMolarMass : knownValue;
    const ratio = productCompound.coefficient / knownCompound.coefficient;
    const theoreticalMoles = knownMoles * ratio;
    const theoreticalValue = actualProductUnit === 'g'
      ? theoreticalMoles * productMolarMass
      : theoreticalMoles;

    const percentYield = (actualProductValue / theoreticalValue) * 100;

    // Display
    const resultDiv = container.createDiv({ cls: 'chem-result' });
    resultDiv.createEl('div', { cls: 'chem-label', text: 'Percent Yield:' });
    renderEquation(equationStr, resultDiv);

    if (plugin.settings.showCalculationSteps) {
      const stepsDiv = resultDiv.createDiv({ cls: 'chem-steps' });

      if (knownUnit === 'g') {
        stepsDiv.createEl('div', {
          text: `${knownValue}g ${knownFormulaStr} \u00F7 ${knownMolarMass.toFixed(dp)} g/mol = ${knownMoles.toFixed(dp)} mol`
        });
      }
      stepsDiv.createEl('div', {
        text: `Molar ratio: ${knownCompound.coefficient}:${productCompound.coefficient}`
      });
      stepsDiv.createEl('div', {
        text: `Theoretical: ${theoreticalMoles.toFixed(dp)} mol = ${(theoreticalMoles * productMolarMass).toFixed(dp)} g ${productFormulaStr}`
      });
      stepsDiv.createEl('div', {
        text: `Actual: ${actualProductValue} ${actualProductUnit} ${productFormulaStr}`
      });
      stepsDiv.createEl('div', {
        text: `% Yield = (${actualProductValue} \u00F7 ${theoreticalValue.toFixed(dp)}) \u00D7 100`
      });
    }

    resultDiv.createDiv({
      cls: 'chem-answer',
      text: `Percent Yield: ${percentYield.toFixed(dp)}%`
    });

    if (percentYield > 100) {
      resultDiv.createDiv({
        cls: 'chem-info',
        text: 'Note: Yield > 100% typically indicates measurement error or impurities'
      });
    }
  } catch (error) {
    container.createDiv({
      cls: 'chem-error',
      text: `Percent yield error: ${error instanceof Error ? error.message : String(error)}`
    });
  }
}
