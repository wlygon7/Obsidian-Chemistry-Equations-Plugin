import { parseEquation, parseFormula, getMolarMass, ParsedFormula } from './parser';
import { renderEquation } from './renderer';
import type ChemistryPlugin from './main';

// Find a compound in the equation by matching its formula text
function findCompound(
  compounds: ParsedFormula[],
  formulaStr: string
): ParsedFormula | null {
  const target = parseFormula(formulaStr);

  for (const compound of compounds) {
    // Compare element maps (ignoring coefficients)
    const aKeys = Object.keys(compound.elements).sort();
    const bKeys = Object.keys(target.elements).sort();

    if (aKeys.length !== bKeys.length) continue;

    let match = true;
    for (let i = 0; i < aKeys.length; i++) {
      if (aKeys[i] !== bKeys[i] || compound.elements[aKeys[i]] !== target.elements[bKeys[i]]) {
        match = false;
        break;
      }
    }
    if (match) return compound;
  }
  return null;
}

export function solveAndDisplayStoichiometry(
  plugin: ChemistryPlugin,
  input: string,
  container: HTMLElement
): void {
  try {
    const pipeIndex = input.indexOf('|');
    if (pipeIndex === -1) {
      throw new Error('Format: equation | value unit formula -> ? unit formula');
    }

    const equationStr = input.substring(0, pipeIndex).trim();
    const problemStr = input.substring(pipeIndex + 1).trim();

    const eq = parseEquation(equationStr);
    const dp = plugin.settings.decimalPlaces;

    // Parse problem: "5g H2 -> ? g H2O"
    const problemMatch = problemStr.match(
      /^([\d.]+)\s*(g|mol)\s+(\S+)\s*->\s*\?\s*(g|mol)\s+(\S+)$/
    );
    if (!problemMatch) {
      throw new Error('Problem format: 5g H2 -> ? g H2O');
    }

    const knownValue = parseFloat(problemMatch[1]);
    const knownUnit = problemMatch[2] as 'g' | 'mol';
    const knownFormulaStr = problemMatch[3];
    const targetUnit = problemMatch[4] as 'g' | 'mol';
    const targetFormulaStr = problemMatch[5];

    // Find compounds in equation
    const allCompounds = [...eq.reactants, ...eq.products];
    const knownCompound = findCompound(allCompounds, knownFormulaStr);
    const targetCompound = findCompound(allCompounds, targetFormulaStr);

    if (!knownCompound) {
      throw new Error(`Could not find ${knownFormulaStr} in the equation`);
    }
    if (!targetCompound) {
      throw new Error(`Could not find ${targetFormulaStr} in the equation`);
    }

    const knownMolarMass = getMolarMass(knownCompound.elements);
    const targetMolarMass = getMolarMass(targetCompound.elements);

    // Step 1: Convert known to moles
    const knownMoles = knownUnit === 'g'
      ? knownValue / knownMolarMass
      : knownValue;

    // Step 2: Molar ratio
    const ratio = targetCompound.coefficient / knownCompound.coefficient;
    const targetMoles = knownMoles * ratio;

    // Step 3: Convert to target unit
    const targetValue = targetUnit === 'g'
      ? targetMoles * targetMolarMass
      : targetMoles;

    // Display
    const resultDiv = container.createDiv({ cls: 'chem-result' });
    resultDiv.createEl('div', { cls: 'chem-label', text: 'Stoichiometry:' });
    renderEquation(equationStr, resultDiv);

    const stepsDiv = resultDiv.createDiv({ cls: 'chem-steps' });

    if (knownUnit === 'g') {
      stepsDiv.createEl('div', {
        text: `Step 1: ${knownValue}g ${knownFormulaStr} \u00F7 ${knownMolarMass.toFixed(dp)} g/mol = ${knownMoles.toFixed(dp)} mol`
      });
    } else {
      stepsDiv.createEl('div', {
        text: `Step 1: ${knownValue} mol ${knownFormulaStr} (given)`
      });
    }

    stepsDiv.createEl('div', {
      text: `Step 2: Molar ratio ${knownFormulaStr}:${targetFormulaStr} = ${knownCompound.coefficient}:${targetCompound.coefficient}`
    });

    stepsDiv.createEl('div', {
      text: `Step 3: ${knownMoles.toFixed(dp)} mol \u00D7 (${targetCompound.coefficient}/${knownCompound.coefficient}) = ${targetMoles.toFixed(dp)} mol ${targetFormulaStr}`
    });

    if (targetUnit === 'g') {
      stepsDiv.createEl('div', {
        text: `Step 4: ${targetMoles.toFixed(dp)} mol \u00D7 ${targetMolarMass.toFixed(dp)} g/mol = ${targetValue.toFixed(dp)}g`
      });
    }

    stepsDiv.createEl('div', {
      cls: 'chem-answer',
      text: `Answer: ${targetValue.toFixed(dp)} ${targetUnit} ${targetFormulaStr}`
    });
  } catch (error) {
    container.createDiv({
      cls: 'chem-error',
      text: `Stoichiometry error: ${error instanceof Error ? error.message : String(error)}`
    });
  }
}
