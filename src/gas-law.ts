import { R_GAS } from './constants';
import type ChemistryPlugin from './main';

interface GasVars {
  P?: number;
  V?: number;
  n?: number;
  T?: number;
  solving: 'P' | 'V' | 'n' | 'T';
}

function parseGasInput(input: string): GasVars {
  const vars: Partial<Record<'P' | 'V' | 'n' | 'T', number>> = {};
  let solving: 'P' | 'V' | 'n' | 'T' | null = null;
  const conversionNotes: string[] = [];

  // Match each variable assignment
  const regex = /([PVnT])\s*=\s*([\d.eE+-]+|\?)\s*(atm|kPa|mmHg|torr|L|mL|mol|K|C|°C)?/gi;
  let match;

  while ((match = regex.exec(input)) !== null) {
    const varName = match[1] as 'P' | 'V' | 'n' | 'T';
    const valueStr = match[2];
    const unit = match[3]?.toLowerCase() || '';

    if (valueStr === '?') {
      if (solving !== null) throw new Error('Only one variable can be unknown (?)');
      solving = varName;
      continue;
    }

    let value = parseFloat(valueStr);

    // Unit conversions
    if (varName === 'P') {
      if (unit === 'kpa') { value /= 101.325; conversionNotes.push(`${valueStr} kPa = ${value.toFixed(4)} atm`); }
      else if (unit === 'mmhg' || unit === 'torr') { value /= 760; conversionNotes.push(`${valueStr} mmHg = ${value.toFixed(4)} atm`); }
    } else if (varName === 'V') {
      if (unit === 'ml') { value /= 1000; conversionNotes.push(`${valueStr} mL = ${value} L`); }
    } else if (varName === 'T') {
      if (unit === 'c' || unit === '°c') { value += 273.15; conversionNotes.push(`${valueStr}\u00B0C = ${value.toFixed(2)} K`); }
    }

    vars[varName] = value;
  }

  if (solving === null) {
    throw new Error('Mark one variable with ? (e.g., V=?)');
  }

  // Validate we have all other variables
  const needed = (['P', 'V', 'n', 'T'] as const).filter(v => v !== solving);
  for (const v of needed) {
    if (vars[v] === undefined) {
      throw new Error(`Missing variable: ${v}`);
    }
  }

  // Validation
  if (vars.T !== undefined && vars.T <= 0) throw new Error('Temperature must be > 0 K');
  if (vars.P !== undefined && vars.P <= 0) throw new Error('Pressure must be > 0');
  if (vars.V !== undefined && vars.V < 0) throw new Error('Volume cannot be negative');
  if (vars.n !== undefined && vars.n < 0) throw new Error('Moles cannot be negative');

  return { P: vars.P, V: vars.V, n: vars.n, T: vars.T, solving };
}

export function gasLawAndDisplay(
  plugin: ChemistryPlugin,
  input: string,
  container: HTMLElement
): void {
  try {
    const dp = plugin.settings.decimalPlaces;
    const gas = parseGasInput(input);

    let result: number;
    let equation: string;

    switch (gas.solving) {
      case 'P':
        result = (gas.n! * R_GAS * gas.T!) / gas.V!;
        equation = `P = nRT/V = (${gas.n} \u00D7 ${R_GAS} \u00D7 ${gas.T}) / ${gas.V}`;
        break;
      case 'V':
        result = (gas.n! * R_GAS * gas.T!) / gas.P!;
        equation = `V = nRT/P = (${gas.n} \u00D7 ${R_GAS} \u00D7 ${gas.T}) / ${gas.P}`;
        break;
      case 'n':
        result = (gas.P! * gas.V!) / (R_GAS * gas.T!);
        equation = `n = PV/RT = (${gas.P} \u00D7 ${gas.V}) / (${R_GAS} \u00D7 ${gas.T})`;
        break;
      case 'T':
        result = (gas.P! * gas.V!) / (gas.n! * R_GAS);
        equation = `T = PV/nR = (${gas.P} \u00D7 ${gas.V}) / (${gas.n} \u00D7 ${R_GAS})`;
        break;
    }

    const units: Record<string, string> = { P: 'atm', V: 'L', n: 'mol', T: 'K' };

    const resultDiv = container.createDiv({ cls: 'chem-result' });
    resultDiv.createEl('div', { cls: 'chem-label', text: 'Ideal Gas Law (PV = nRT):' });

    if (plugin.settings.showCalculationSteps) {
      const stepsDiv = resultDiv.createDiv({ cls: 'chem-steps' });

      // Show given values
      const given = (['P', 'V', 'n', 'T'] as const)
        .filter(v => v !== gas.solving)
        .map(v => `${v} = ${gas[v]} ${units[v]}`)
        .join(', ');
      stepsDiv.createEl('div', { text: `Given: ${given}` });
      stepsDiv.createEl('div', { text: `R = ${R_GAS} L\u00B7atm/(mol\u00B7K)` });
      stepsDiv.createEl('div', { text: `Solving for ${gas.solving}: ${equation}` });
    }

    resultDiv.createDiv({
      cls: 'chem-answer',
      text: `${gas.solving} = ${result.toFixed(dp)} ${units[gas.solving]}`
    });

    // Helpful context
    if (gas.solving === 'T' && result < 200) {
      resultDiv.createDiv({ cls: 'chem-info', text: 'Very low temperature result' });
    }
  } catch (error) {
    container.createDiv({
      cls: 'chem-error',
      text: `Gas law error: ${error instanceof Error ? error.message : String(error)}`
    });
  }
}
