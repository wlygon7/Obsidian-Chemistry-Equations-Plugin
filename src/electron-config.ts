import { PERIODIC_TABLE } from './periodic-table';
import type ChemistryPlugin from './main';

interface Orbital {
  n: number;
  l: string;
  capacity: number;
}

const FILL_ORDER: Orbital[] = [
  { n: 1, l: 's', capacity: 2 },
  { n: 2, l: 's', capacity: 2 },
  { n: 2, l: 'p', capacity: 6 },
  { n: 3, l: 's', capacity: 2 },
  { n: 3, l: 'p', capacity: 6 },
  { n: 4, l: 's', capacity: 2 },
  { n: 3, l: 'd', capacity: 10 },
  { n: 4, l: 'p', capacity: 6 },
  { n: 5, l: 's', capacity: 2 },
  { n: 4, l: 'd', capacity: 10 },
  { n: 5, l: 'p', capacity: 6 },
  { n: 6, l: 's', capacity: 2 },
  { n: 4, l: 'f', capacity: 14 },
  { n: 5, l: 'd', capacity: 10 },
  { n: 6, l: 'p', capacity: 6 },
  { n: 7, l: 's', capacity: 2 },
  { n: 5, l: 'f', capacity: 14 },
  { n: 6, l: 'd', capacity: 10 },
  { n: 7, l: 'p', capacity: 6 },
];

// Known exceptions to Aufbau principle (neutral atoms)
const EXCEPTIONS: Record<number, Array<{ n: number; l: string; electrons: number }>> = {
  24: [{ n: 3, l: 'd', electrons: 5 }, { n: 4, l: 's', electrons: 1 }],   // Cr
  29: [{ n: 3, l: 'd', electrons: 10 }, { n: 4, l: 's', electrons: 1 }],  // Cu
  41: [{ n: 4, l: 'd', electrons: 4 }, { n: 5, l: 's', electrons: 1 }],   // Nb
  42: [{ n: 4, l: 'd', electrons: 5 }, { n: 5, l: 's', electrons: 1 }],   // Mo
  44: [{ n: 4, l: 'd', electrons: 7 }, { n: 5, l: 's', electrons: 1 }],   // Ru
  45: [{ n: 4, l: 'd', electrons: 8 }, { n: 5, l: 's', electrons: 1 }],   // Rh
  46: [{ n: 4, l: 'd', electrons: 10 }, { n: 5, l: 's', electrons: 0 }],  // Pd
  47: [{ n: 4, l: 'd', electrons: 10 }, { n: 5, l: 's', electrons: 1 }],  // Ag
  78: [{ n: 5, l: 'd', electrons: 9 }, { n: 6, l: 's', electrons: 1 }],   // Pt
  79: [{ n: 5, l: 'd', electrons: 10 }, { n: 6, l: 's', electrons: 1 }],  // Au
};

const NOBLE_GAS_CORES = [
  { symbol: 'Rn', atomicNumber: 86 },
  { symbol: 'Xe', atomicNumber: 54 },
  { symbol: 'Kr', atomicNumber: 36 },
  { symbol: 'Ar', atomicNumber: 18 },
  { symbol: 'Ne', atomicNumber: 10 },
  { symbol: 'He', atomicNumber: 2 },
];

interface FilledOrbital {
  n: number;
  l: string;
  electrons: number;
}

function fillOrbitals(totalElectrons: number): FilledOrbital[] {
  const orbitals: FilledOrbital[] = [];
  let remaining = totalElectrons;

  for (const orbital of FILL_ORDER) {
    if (remaining <= 0) break;
    const electrons = Math.min(remaining, orbital.capacity);
    orbitals.push({ n: orbital.n, l: orbital.l, electrons });
    remaining -= electrons;
  }

  return orbitals;
}

function applyExceptions(atomicNumber: number, orbitals: FilledOrbital[]): FilledOrbital[] {
  const exception = EXCEPTIONS[atomicNumber];
  if (!exception) return orbitals;

  // Replace the last d and s orbitals with exception values
  for (const exc of exception) {
    const idx = orbitals.findIndex(o => o.n === exc.n && o.l === exc.l);
    if (idx >= 0) {
      if (exc.electrons === 0) {
        orbitals.splice(idx, 1);
      } else {
        orbitals[idx].electrons = exc.electrons;
      }
    } else if (exc.electrons > 0) {
      orbitals.push(exc);
    }
  }

  return orbitals;
}

function removeElectronsForIon(orbitals: FilledOrbital[], toRemove: number): FilledOrbital[] {
  let remaining = toRemove;

  // Remove from highest n first, then s before d (for transition metals: 4s before 3d)
  // Sort by n descending, then s before d (s has lower l-order)
  const lOrder: Record<string, number> = { s: 0, p: 1, d: 2, f: 3 };

  while (remaining > 0 && orbitals.length > 0) {
    // Find the orbital to remove from: highest n, then lowest l (s before p before d)
    let targetIdx = 0;
    for (let i = 1; i < orbitals.length; i++) {
      const curr = orbitals[i];
      const best = orbitals[targetIdx];
      if (curr.n > best.n || (curr.n === best.n && lOrder[curr.l] < lOrder[best.l])) {
        targetIdx = i;
      }
    }

    const removed = Math.min(remaining, orbitals[targetIdx].electrons);
    orbitals[targetIdx].electrons -= removed;
    remaining -= removed;

    if (orbitals[targetIdx].electrons === 0) {
      orbitals.splice(targetIdx, 1);
    }
  }

  return orbitals;
}

function formatConfig(
  orbitals: FilledOrbital[],
  showCore: boolean
): { full: string; abbreviated: string; coreSymbol?: string } {
  // Sort orbitals by n then l for display
  const lOrder: Record<string, number> = { s: 0, p: 1, d: 2, f: 3 };
  const sorted = [...orbitals].sort((a, b) =>
    a.n - b.n || lOrder[a.l] - lOrder[b.l]
  );

  const full = sorted.map(o => `${o.n}${o.l}${o.electrons}`).join(' ');

  if (!showCore) return { full, abbreviated: full };

  // Find noble gas core
  const totalByOrbital = new Map<string, number>();
  for (const o of sorted) {
    totalByOrbital.set(`${o.n}${o.l}`, o.electrons);
  }

  for (const noble of NOBLE_GAS_CORES) {
    const coreOrbitals = fillOrbitals(noble.atomicNumber);
    const coreSorted = [...coreOrbitals].sort((a, b) =>
      a.n - b.n || lOrder[a.l] - lOrder[b.l]
    );

    // Check if our config starts with this noble gas config
    let matches = true;
    for (const co of coreSorted) {
      const key = `${co.n}${co.l}`;
      if (!totalByOrbital.has(key) || totalByOrbital.get(key)! < co.electrons) {
        matches = false;
        break;
      }
    }

    if (matches && sorted.length > coreSorted.length) {
      const remaining = sorted.slice(coreSorted.length);
      const abbrev = `[${noble.symbol}] ` + remaining.map(o => `${o.n}${o.l}${o.electrons}`).join(' ');
      return { full, abbreviated: abbrev, coreSymbol: noble.symbol };
    }
  }

  return { full, abbreviated: full };
}

export function electronConfigAndDisplay(
  plugin: ChemistryPlugin,
  input: string,
  container: HTMLElement
): void {
  try {
    // Parse input: "Fe" or "Fe3+" or "Fe2-"
    const match = input.trim().match(/^([A-Z][a-z]?)(\d*)([\+\-])?$/);
    if (!match) {
      throw new Error('Format: Fe  or  Fe3+  or  O2-');
    }

    const symbol = match[1];
    const chargeMagnitude = match[2] ? parseInt(match[2]) : (match[3] ? 1 : 0);
    const chargeSign = match[3] || '';
    const charge = chargeSign === '+' ? chargeMagnitude : (chargeSign === '-' ? -chargeMagnitude : 0);

    const element = PERIODIC_TABLE[symbol];
    if (!element) throw new Error(`Unknown element: ${symbol}`);

    const totalElectrons = element.atomicNumber - charge;
    if (totalElectrons < 0) throw new Error(`Charge ${charge}+ is too high for ${symbol} (Z=${element.atomicNumber})`);
    if (totalElectrons > 118) throw new Error('Too many electrons');

    // Build configuration
    let orbitals: FilledOrbital[];

    if (charge === 0 && EXCEPTIONS[element.atomicNumber]) {
      // Use standard fill but apply exception for this element
      orbitals = fillOrbitals(element.atomicNumber);
      orbitals = applyExceptions(element.atomicNumber, orbitals);
    } else if (charge > 0) {
      // For cations: fill neutral atom first, then remove electrons
      let neutralOrbitals = fillOrbitals(element.atomicNumber);
      neutralOrbitals = applyExceptions(element.atomicNumber, neutralOrbitals);
      orbitals = removeElectronsForIon(neutralOrbitals, charge);
    } else {
      // For anions or neutral: just fill
      orbitals = fillOrbitals(totalElectrons);
    }

    const { full, abbreviated, coreSymbol } = formatConfig(orbitals, plugin.settings.showNobleGasCore);
    const isException = charge === 0 && EXCEPTIONS[element.atomicNumber] !== undefined;

    // Display
    const resultDiv = container.createDiv({ cls: 'chem-result' });
    resultDiv.createEl('div', { cls: 'chem-label', text: 'Electron Configuration:' });

    const infoText = charge !== 0
      ? `${element.name} (${symbol}${charge > 0 ? charge + '+' : Math.abs(charge) + '-'}) \u2014 Z=${element.atomicNumber}, ${totalElectrons} electrons`
      : `${element.name} (${symbol}) \u2014 Z=${element.atomicNumber}, ${totalElectrons} electrons`;
    resultDiv.createDiv({ cls: 'chem-steps', text: infoText });

    // Render configuration with superscripts
    const configDiv = resultDiv.createDiv({ cls: 'chem-config-display' });
    const configStr = plugin.settings.showNobleGasCore && coreSymbol ? abbreviated : full;
    const parts = configStr.split(/\s+/);

    for (const part of parts) {
      if (part.startsWith('[')) {
        // Noble gas core
        const span = configDiv.createSpan({ cls: 'chem-config-subshell' });
        span.textContent = part;
      } else {
        // Orbital like "1s2"
        const orbMatch = part.match(/^(\d[spdf])(\d+)$/);
        if (orbMatch) {
          const span = configDiv.createSpan({ cls: 'chem-config-subshell' });
          span.createSpan({ text: orbMatch[1] });
          span.createEl('sup', { text: orbMatch[2] });
        } else {
          configDiv.createSpan({ text: part + ' ' });
        }
      }
    }

    if (isException) {
      resultDiv.createDiv({
        cls: 'chem-info',
        text: 'Note: This element has an anomalous configuration (half-filled or fully-filled d/f subshell stability)'
      });
    }

    // Show full config if abbreviated
    if (plugin.settings.showNobleGasCore && coreSymbol && full !== abbreviated) {
      resultDiv.createDiv({
        cls: 'chem-info',
        text: `Full: ${full}`
      });
    }
  } catch (error) {
    container.createDiv({
      cls: 'chem-error',
      text: `Electron config error: ${error instanceof Error ? error.message : String(error)}`
    });
  }
}
