import type ChemistryPlugin from './main';

export function thermochemAndDisplay(
  plugin: ChemistryPlugin,
  input: string,
  container: HTMLElement
): void {
  try {
    const dp = plugin.settings.decimalPlaces;

    // Parse key=value pairs: m=100g C=4.184 dT=25
    const vars: Record<string, number> = {};
    let solving: string | null = null;

    const regex = /([mqcC]|dT|dt|DT)\s*=\s*([\d.eE+-]+|\?)\s*(g|kg|J|kJ)?/g;
    let match;

    while ((match = regex.exec(input)) !== null) {
      const key = match[1].toLowerCase();
      const normalizedKey = key === 'dt' ? 'dt' : key;
      const valueStr = match[2];
      const unit = (match[3] || '').toLowerCase();

      if (valueStr === '?') {
        if (solving !== null) throw new Error('Only one variable can be unknown (?)');
        solving = normalizedKey;
        continue;
      }

      let value = parseFloat(valueStr);

      // Unit conversions
      if (normalizedKey === 'm' && unit === 'kg') value *= 1000;  // kg -> g
      if (normalizedKey === 'q' && unit === 'kj') value *= 1000;   // kJ -> J

      vars[normalizedKey] = value;
    }

    if (solving === null) {
      // If no ?, default to solving for q
      solving = 'q';
    }

    // Ensure we have all other variables
    const allVars = ['q', 'm', 'c', 'dt'];
    const needed = allVars.filter(v => v !== solving);
    for (const v of needed) {
      if (vars[v] === undefined) {
        throw new Error(`Missing variable: ${v}. Format: m=100g C=4.184 dT=25`);
      }
    }

    // Solve
    let result: number;
    let equation: string;

    switch (solving) {
      case 'q':
        result = vars['m'] * vars['c'] * vars['dt'];
        equation = `q = m \u00D7 C \u00D7 \u0394T = ${vars['m']} \u00D7 ${vars['c']} \u00D7 ${vars['dt']}`;
        break;
      case 'm':
        result = vars['q'] / (vars['c'] * vars['dt']);
        equation = `m = q / (C \u00D7 \u0394T) = ${vars['q']} / (${vars['c']} \u00D7 ${vars['dt']})`;
        break;
      case 'c':
        result = vars['q'] / (vars['m'] * vars['dt']);
        equation = `C = q / (m \u00D7 \u0394T) = ${vars['q']} / (${vars['m']} \u00D7 ${vars['dt']})`;
        break;
      case 'dt':
        result = vars['q'] / (vars['m'] * vars['c']);
        equation = `\u0394T = q / (m \u00D7 C) = ${vars['q']} / (${vars['m']} \u00D7 ${vars['c']})`;
        break;
      default:
        throw new Error(`Unknown variable: ${solving}`);
    }

    const units: Record<string, string> = {
      q: 'J', m: 'g', c: 'J/(g\u00B7\u00B0C)', dt: '\u00B0C'
    };

    // Classification
    const qValue = solving === 'q' ? result : vars['q'];
    const thermal = qValue > 0 ? 'Endothermic (heat absorbed)' : qValue < 0 ? 'Exothermic (heat released)' : 'No heat exchange';

    // Display
    const resultDiv = container.createDiv({ cls: 'chem-result' });
    resultDiv.createEl('div', { cls: 'chem-label', text: 'Thermochemistry (q = mc\u0394T):' });

    if (plugin.settings.showCalculationSteps) {
      const stepsDiv = resultDiv.createDiv({ cls: 'chem-steps' });

      const givenStr = needed.map(v => {
        const label = v === 'dt' ? '\u0394T' : v === 'c' ? 'C' : v;
        return `${label} = ${vars[v]} ${units[v]}`;
      }).join(', ');
      stepsDiv.createEl('div', { text: `Given: ${givenStr}` });
      stepsDiv.createEl('div', { text: equation });
    }

    const solveLabel = solving === 'dt' ? '\u0394T' : solving === 'c' ? 'C' : solving;
    resultDiv.createDiv({
      cls: 'chem-answer',
      text: `${solveLabel} = ${result.toFixed(dp)} ${units[solving]}`
    });

    // Show kJ if solving for q
    if (solving === 'q') {
      resultDiv.createDiv({
        cls: 'chem-info',
        text: `= ${(result / 1000).toFixed(dp)} kJ | ${thermal}`
      });
    } else {
      resultDiv.createDiv({ cls: 'chem-info', text: thermal });
    }
  } catch (error) {
    container.createDiv({
      cls: 'chem-error',
      text: `Thermochemistry error: ${error instanceof Error ? error.message : String(error)}`
    });
  }
}
