import { KW } from './constants';
import type ChemistryPlugin from './main';

export function phAndDisplay(
  plugin: ChemistryPlugin,
  input: string,
  mode: 'pH' | 'pOH',
  container: HTMLElement
): void {
  try {
    const dp = plugin.settings.decimalPlaces;
    const trimmed = input.trim();

    let hConc: number;
    let ohConc: number;
    let pH: number;
    let pOH: number;
    const steps: string[] = [];

    // Mode 1: Weak acid/base - "weak acid 0.1M Ka=1.8e-5"
    const weakMatch = trimmed.match(/^weak\s+(acid|base)\s+([\d.eE+-]+)M?\s+K([ab])=([\d.eE+-]+)$/i);
    if (weakMatch) {
      const type = weakMatch[1].toLowerCase();
      const conc = parseFloat(weakMatch[2]);
      const constType = weakMatch[3].toLowerCase();
      const kValue = parseFloat(weakMatch[4]);

      if (conc <= 0) throw new Error('Concentration must be positive');
      if (kValue <= 0) throw new Error('K value must be positive');

      // Quadratic: x² + K·x - K·C = 0
      // x = (-K + √(K² + 4KC)) / 2
      const discriminant = kValue * kValue + 4 * kValue * conc;
      const x = (-kValue + Math.sqrt(discriminant)) / 2;
      const percentDissociation = (x / conc) * 100;

      if (type === 'acid' || constType === 'a') {
        hConc = x;
        steps.push(`Ka expression: Ka = x\u00B2 / (C - x)`);
        steps.push(`Quadratic: x\u00B2 + Ka\u00B7x - Ka\u00B7C = 0`);
        steps.push(`x = (-Ka + \u221A(Ka\u00B2 + 4\u00B7Ka\u00B7C)) / 2`);
        steps.push(`x = (-${kValue.toExponential(2)} + \u221A(${discriminant.toExponential(2)})) / 2`);
        steps.push(`[H\u207A] = ${x.toExponential(dp)}`);
        steps.push(`% dissociation = (${x.toExponential(2)} / ${conc}) \u00D7 100 = ${percentDissociation.toFixed(dp)}%`);
      } else {
        ohConc = x;
        hConc = KW / ohConc;
        steps.push(`Kb expression: Kb = x\u00B2 / (C - x)`);
        steps.push(`x = [OH\u207B] = ${x.toExponential(dp)}`);
        steps.push(`[H\u207A] = Kw / [OH\u207B] = ${KW.toExponential(1)} / ${x.toExponential(2)} = ${hConc.toExponential(dp)}`);
        steps.push(`% dissociation = ${percentDissociation.toFixed(dp)}%`);
      }

      pH = -Math.log10(hConc);
      pOH = 14 - pH;
      ohConc = Math.pow(10, -pOH);

    // Mode 2: Strong acid/base - "strong acid 0.01M HCl"
    } else {
      const strongMatch = trimmed.match(/^strong\s+(acid|base)\s+([\d.eE+-]+)M?\s*(\S+)?$/i);
      if (strongMatch) {
        const type = strongMatch[1].toLowerCase();
        const conc = parseFloat(strongMatch[2]);

        if (conc <= 0) throw new Error('Concentration must be positive');

        if (type === 'acid') {
          hConc = conc;
          steps.push(`Strong acid: fully dissociates`);
          steps.push(`[H\u207A] = ${conc} M`);

          if (conc < 1e-6) {
            steps.push(`Note: At very low concentrations, water autoionization is significant`);
          }
        } else {
          ohConc = conc;
          hConc = KW / ohConc;
          steps.push(`Strong base: fully dissociates`);
          steps.push(`[OH\u207B] = ${conc} M`);
          steps.push(`[H\u207A] = Kw / [OH\u207B] = ${KW.toExponential(1)} / ${conc} = ${hConc.toExponential(dp)}`);
        }

        pH = -Math.log10(hConc);
        pOH = 14 - pH;
        ohConc = Math.pow(10, -pOH);

      // Mode 3: Direct concentration - just a number
      } else {
        const directValue = parseFloat(trimmed);
        if (isNaN(directValue) || directValue <= 0) {
          throw new Error('Format: 0.01  or  strong acid 0.01M HCl  or  weak acid 0.1M Ka=1.8e-5');
        }

        if (mode === 'pH') {
          hConc = directValue;
          pH = -Math.log10(hConc);
          pOH = 14 - pH;
          ohConc = Math.pow(10, -pOH);
          steps.push(`[H\u207A] = ${directValue} M`);
          steps.push(`pH = -log\u2081\u2080(${directValue})`);
        } else {
          ohConc = directValue;
          pOH = -Math.log10(ohConc);
          pH = 14 - pOH;
          hConc = Math.pow(10, -pH);
          steps.push(`[OH\u207B] = ${directValue} M`);
          steps.push(`pOH = -log\u2081\u2080(${directValue})`);
        }
      }
    }

    // Classify solution
    let classification: string;
    if (Math.abs(pH - 7) < 0.01) classification = 'Neutral';
    else if (pH < 7) classification = 'Acidic';
    else classification = 'Basic';

    // Display
    const resultDiv = container.createDiv({ cls: 'chem-result' });
    resultDiv.createEl('div', { cls: 'chem-label', text: `${mode} Calculation:` });

    if (plugin.settings.showCalculationSteps) {
      const stepsDiv = resultDiv.createDiv({ cls: 'chem-steps' });
      for (const step of steps) {
        stepsDiv.createEl('div', { text: step });
      }
    }

    const answerDiv = resultDiv.createDiv({ cls: 'chem-steps' });
    answerDiv.createEl('div', { text: `pH = ${pH!.toFixed(dp)}` });
    answerDiv.createEl('div', { text: `pOH = ${pOH!.toFixed(dp)}` });
    answerDiv.createEl('div', { text: `[H\u207A] = ${hConc!.toExponential(dp)} M` });
    answerDiv.createEl('div', { text: `[OH\u207B] = ${ohConc!.toExponential(dp)} M` });

    resultDiv.createDiv({
      cls: 'chem-answer',
      text: `${mode} = ${mode === 'pH' ? pH!.toFixed(dp) : pOH!.toFixed(dp)} (${classification})`
    });
  } catch (error) {
    container.createDiv({
      cls: 'chem-error',
      text: `${mode} error: ${error instanceof Error ? error.message : String(error)}`
    });
  }
}
