import { parseEquation } from './parser';
import { renderEquation } from './renderer';
import type ChemistryPlugin from './main';

export function equilibriumAndDisplay(
  plugin: ChemistryPlugin,
  input: string,
  container: HTMLElement
): void {
  try {
    const dp = plugin.settings.decimalPlaces;

    const pipeIndex = input.indexOf('|');
    if (pipeIndex === -1) {
      throw new Error('Format: equation | [A]=0.5 [B]=0.3 [C]=0.2');
    }

    const equationStr = input.substring(0, pipeIndex).trim();
    const concsStr = input.substring(pipeIndex + 1).trim();

    const eq = parseEquation(equationStr);

    // Parse concentrations: [N2]=0.5 [H2]=0.3 [NH3]=0.2
    const concMap: Record<string, number> = {};
    const concRegex = /\[([^\]]+)\]\s*=\s*([\d.eE+-]+)/g;
    let match;

    while ((match = concRegex.exec(concsStr)) !== null) {
      concMap[match[1]] = parseFloat(match[2]);
    }

    if (Object.keys(concMap).length === 0) {
      throw new Error('No concentrations found. Format: [N2]=0.5 [H2]=0.3');
    }

    // Build K expression symbolically
    const productTerms = eq.products.map(p => {
      const formula = p.original.replace(/\((s|l|g|aq)\)\s*$/, '').trim();
      return p.coefficient === 1 ? `[${formula}]` : `[${formula}]${toSuperscript(p.coefficient)}`;
    });
    const reactantTerms = eq.reactants.map(r => {
      const formula = r.original.replace(/\((s|l|g|aq)\)\s*$/, '').trim();
      return r.coefficient === 1 ? `[${formula}]` : `[${formula}]${toSuperscript(r.coefficient)}`;
    });

    const kExpression = `K = ${productTerms.join(' \u00D7 ')} / ${reactantTerms.length > 1 ? '(' + reactantTerms.join(' \u00D7 ') + ')' : reactantTerms.join(' \u00D7 ')}`;

    // Calculate K numerically
    let numerator = 1;
    let denominator = 1;
    const numSteps: string[] = [];
    const denSteps: string[] = [];

    for (const product of eq.products) {
      const formula = product.original.replace(/\((s|l|g|aq)\)\s*$/, '').trim();
      const conc = concMap[formula];
      if (conc === undefined) throw new Error(`Missing concentration for product: ${formula}`);
      const term = Math.pow(conc, product.coefficient);
      numerator *= term;
      numSteps.push(product.coefficient === 1 ? `${conc}` : `${conc}${toSuperscript(product.coefficient)}`);
    }

    for (const reactant of eq.reactants) {
      const formula = reactant.original.replace(/\((s|l|g|aq)\)\s*$/, '').trim();
      const conc = concMap[formula];
      if (conc === undefined) throw new Error(`Missing concentration for reactant: ${formula}`);
      const term = Math.pow(conc, reactant.coefficient);
      denominator *= term;
      denSteps.push(reactant.coefficient === 1 ? `${conc}` : `${conc}${toSuperscript(reactant.coefficient)}`);
    }

    const K = numerator / denominator;

    // Classify
    let classification: string;
    if (K > 1e4) classification = 'Strongly favors products';
    else if (K > 1) classification = 'Favors products';
    else if (K > 1e-4) classification = 'Favors reactants';
    else classification = 'Strongly favors reactants';

    // Display
    const resultDiv = container.createDiv({ cls: 'chem-result' });
    resultDiv.createEl('div', { cls: 'chem-label', text: 'Equilibrium Constant:' });
    renderEquation(equationStr, resultDiv);

    if (plugin.settings.showCalculationSteps) {
      const stepsDiv = resultDiv.createDiv({ cls: 'chem-steps' });
      stepsDiv.createEl('div', { text: kExpression });
      stepsDiv.createEl('div', {
        text: `K = (${numSteps.join(' \u00D7 ')}) / (${denSteps.join(' \u00D7 ')})`
      });
      stepsDiv.createEl('div', {
        text: `K = ${numerator.toExponential(dp)} / ${denominator.toExponential(dp)}`
      });
    }

    const kDisplay = Math.abs(K) < 0.001 || Math.abs(K) > 10000
      ? K.toExponential(dp)
      : K.toFixed(dp);

    resultDiv.createDiv({
      cls: 'chem-answer',
      text: `K = ${kDisplay}`
    });

    resultDiv.createDiv({
      cls: 'chem-info',
      text: classification
    });
  } catch (error) {
    container.createDiv({
      cls: 'chem-error',
      text: `Equilibrium error: ${error instanceof Error ? error.message : String(error)}`
    });
  }
}

function toSuperscript(n: number): string {
  const superscripts: Record<string, string> = {
    '0': '\u2070', '1': '\u00B9', '2': '\u00B2', '3': '\u00B3',
    '4': '\u2074', '5': '\u2075', '6': '\u2076', '7': '\u2077',
    '8': '\u2078', '9': '\u2079'
  };
  return String(n).split('').map(c => superscripts[c] || c).join('');
}
