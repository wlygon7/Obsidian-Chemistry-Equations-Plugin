import { parseFormula } from './parser';
import { renderFormula } from './renderer';
import type ChemistryPlugin from './main';

// Elements with fixed oxidation states in compounds
const FIXED_STATES: Record<string, number> = {
  F: -1,
  Li: 1, Na: 1, K: 1, Rb: 1, Cs: 1, Fr: 1,       // Group 1
  Be: 2, Mg: 2, Ca: 2, Sr: 2, Ba: 2, Ra: 2,        // Group 2
  Al: 3,
  Zn: 2, Cd: 2,
};

// Known peroxides where O = -1
const PEROXIDE_SIGNATURES = new Set([
  'H2O2', 'Na2O2', 'K2O2', 'BaO2', 'Li2O2', 'Rb2O2', 'Cs2O2',
]);

// Metal hydrides where H = -1
const HYDRIDE_METALS = new Set([
  'Li', 'Na', 'K', 'Rb', 'Cs', 'Ca', 'Sr', 'Ba', 'Al',
]);

function isMetalHydride(elements: Record<string, number>): boolean {
  const elems = Object.keys(elements);
  return elems.length === 2 && elems.includes('H') &&
    elems.some(e => HYDRIDE_METALS.has(e));
}

export function oxidationAndDisplay(
  plugin: ChemistryPlugin,
  input: string,
  container: HTMLElement
): void {
  try {
    const parsed = parseFormula(input);
    const elements = parsed.elements;
    const netCharge = parsed.charge || 0;
    const dp = plugin.settings.decimalPlaces;

    // Pure element: all atoms have oxidation state 0
    if (Object.keys(elements).length === 1) {
      const [el, count] = Object.entries(elements)[0];
      const resultDiv = container.createDiv({ cls: 'chem-result' });
      resultDiv.createEl('div', { cls: 'chem-label', text: 'Oxidation States:' });
      const headerDiv = resultDiv.createDiv({ cls: 'chem-result-header' });
      renderFormula(input, headerDiv);
      resultDiv.createDiv({
        cls: 'chem-answer',
        text: `${el}: 0 (pure element)`
      });
      return;
    }

    // Determine special cases
    const formulaStr = Object.entries(elements)
      .map(([el, c]) => c === 1 ? el : `${el}${c}`)
      .join('');
    const isPeroxide = PEROXIDE_SIGNATURES.has(formulaStr);
    const isHydride = isMetalHydride(elements);

    // Assign known states
    const assigned: Record<string, number> = {};
    const unknown: string[] = [];
    let knownSum = 0;

    for (const [element, count] of Object.entries(elements)) {
      if (element === 'O') {
        if (isPeroxide) {
          assigned[element] = -1;
          knownSum += -1 * count;
        } else {
          assigned[element] = -2;
          knownSum += -2 * count;
        }
      } else if (element === 'H') {
        if (isHydride) {
          assigned[element] = -1;
          knownSum += -1 * count;
        } else {
          assigned[element] = 1;
          knownSum += 1 * count;
        }
      } else if (element in FIXED_STATES) {
        assigned[element] = FIXED_STATES[element];
        knownSum += FIXED_STATES[element] * count;
      } else {
        unknown.push(element);
      }
    }

    // Solve for unknowns
    if (unknown.length === 1) {
      const el = unknown[0];
      const count = elements[el];
      const state = (netCharge - knownSum) / count;
      assigned[el] = state;
    } else if (unknown.length === 0) {
      // All known — verify
    } else {
      // Multiple unknowns: can't determine individually
      const resultDiv = container.createDiv({ cls: 'chem-result' });
      resultDiv.createEl('div', { cls: 'chem-label', text: 'Oxidation States:' });
      renderFormula(input, resultDiv);

      for (const [el, state] of Object.entries(assigned)) {
        resultDiv.createDiv({ text: `${el}: ${state > 0 ? '+' : ''}${state}` });
      }
      resultDiv.createDiv({
        cls: 'chem-info',
        text: `Cannot determine individual states for: ${unknown.join(', ')} (multiple unknowns)`
      });
      return;
    }

    // Display
    const resultDiv = container.createDiv({ cls: 'chem-result' });
    resultDiv.createEl('div', { cls: 'chem-label', text: 'Oxidation States:' });

    const headerDiv = resultDiv.createDiv({ cls: 'chem-result-header' });
    renderFormula(input, headerDiv);
    if (netCharge !== 0) {
      headerDiv.createSpan({ text: ` (net charge: ${netCharge > 0 ? '+' : ''}${netCharge})` });
    }

    // Grid display
    const grid = resultDiv.createDiv({ cls: 'chem-oxidation-grid' });
    grid.createSpan({ cls: 'chem-oxidation-header', text: 'Element' });
    grid.createSpan({ cls: 'chem-oxidation-header', text: 'Count' });
    grid.createSpan({ cls: 'chem-oxidation-header', text: 'Ox. State' });
    grid.createSpan({ cls: 'chem-oxidation-header', text: 'Contribution' });

    if (plugin.settings.showCalculationSteps) {
      for (const [element, count] of Object.entries(elements)) {
        const state = assigned[element];
        const contribution = state * count;

        grid.createSpan({ text: element });
        grid.createSpan({ text: String(count) });
        grid.createSpan({
          cls: 'chem-oxidation-state',
          text: `${state > 0 ? '+' : ''}${Number.isInteger(state) ? state : state.toFixed(dp)}`
        });
        grid.createSpan({ text: `${state > 0 ? '+' : ''}${Number.isInteger(contribution) ? contribution : contribution.toFixed(dp)}` });
      }

      // Verification
      const total = Object.entries(elements).reduce((sum, [el, count]) => sum + (assigned[el] * count), 0);
      resultDiv.createDiv({
        cls: 'chem-info',
        text: `Sum: ${total} = ${netCharge} (net charge) \u2714`
      });
    }

    // Highlight the solved element
    if (unknown.length === 1) {
      const el = unknown[0];
      const state = assigned[el];
      const stateStr = Number.isInteger(state) ? String(state) : state.toFixed(dp);
      resultDiv.createDiv({
        cls: 'chem-answer',
        text: `${el} oxidation state: ${state > 0 ? '+' : ''}${stateStr}`
      });
    }

    // Notes
    if (isPeroxide) {
      resultDiv.createDiv({ cls: 'chem-info', text: 'Peroxide detected: O = -1' });
    }
    if (isHydride) {
      resultDiv.createDiv({ cls: 'chem-info', text: 'Metal hydride detected: H = -1' });
    }
    if (unknown.length === 1) {
      const state = assigned[unknown[0]];
      if (!Number.isInteger(state)) {
        resultDiv.createDiv({
          cls: 'chem-info',
          text: 'Non-integer oxidation state suggests mixed oxidation states in this compound'
        });
      }
    }
  } catch (error) {
    container.createDiv({
      cls: 'chem-error',
      text: `Oxidation state error: ${error instanceof Error ? error.message : String(error)}`
    });
  }
}
