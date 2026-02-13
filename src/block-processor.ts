import { MarkdownPostProcessorContext } from 'obsidian';
import type ChemistryPlugin from './main';
import { renderEquation, renderFormula } from './renderer';
import { calculateAndDisplayMolarMass, convertAndDisplay } from './calculator';
import { balanceAndDisplay } from './balancer';
import { solveAndDisplayStoichiometry } from './stoichiometry';
import { compositionAndDisplay } from './composition';
import { empiricalAndDisplay, molecularAndDisplay } from './empirical';
import { limitingReagentAndDisplay } from './limiting-reagent';
import { percentYieldAndDisplay } from './percent-yield';
import { molarityAndDisplay, dilutionAndDisplay } from './molarity';
import { gasLawAndDisplay } from './gas-law';
import { phAndDisplay } from './ph';
import { electronConfigAndDisplay } from './electron-config';
import { oxidationAndDisplay } from './oxidation';
import { thermochemAndDisplay } from './thermochem';
import { equilibriumAndDisplay } from './equilibrium';

export function processChemBlock(
  plugin: ChemistryPlugin,
  source: string,
  el: HTMLElement,
  ctx: MarkdownPostProcessorContext
): void {
  const lines = source.trim().split('\n');
  const container = el.createDiv({ cls: 'chem-block' });

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    try {
      if (trimmed.startsWith('molar:') || trimmed.startsWith('calc:')) {
        const formula = trimmed.replace(/^(molar|calc):/, '').trim();
        calculateAndDisplayMolarMass(plugin, formula, container);
      } else if (trimmed.startsWith('composition:')) {
        compositionAndDisplay(plugin, trimmed.substring(12).trim(), container);
      } else if (trimmed.startsWith('empirical:')) {
        empiricalAndDisplay(plugin, trimmed.substring(10).trim(), container);
      } else if (trimmed.startsWith('molecular:')) {
        molecularAndDisplay(plugin, trimmed.substring(10).trim(), container);
      } else if (trimmed.startsWith('balance:')) {
        balanceAndDisplay(plugin, trimmed.substring(8).trim(), container);
      } else if (trimmed.startsWith('convert:')) {
        convertAndDisplay(plugin, trimmed.substring(8).trim(), container);
      } else if (trimmed.startsWith('stoich:')) {
        solveAndDisplayStoichiometry(plugin, trimmed.substring(7).trim(), container);
      } else if (trimmed.startsWith('limiting:')) {
        limitingReagentAndDisplay(plugin, trimmed.substring(9).trim(), container);
      } else if (trimmed.startsWith('yield:')) {
        percentYieldAndDisplay(plugin, trimmed.substring(6).trim(), container);
      } else if (trimmed.startsWith('molarity:')) {
        molarityAndDisplay(plugin, trimmed.substring(9).trim(), container);
      } else if (trimmed.startsWith('dilution:')) {
        dilutionAndDisplay(plugin, trimmed.substring(9).trim(), container);
      } else if (trimmed.startsWith('gas:')) {
        gasLawAndDisplay(plugin, trimmed.substring(4).trim(), container);
      } else if (trimmed.startsWith('pH:')) {
        phAndDisplay(plugin, trimmed.substring(3).trim(), 'pH', container);
      } else if (trimmed.startsWith('pOH:')) {
        phAndDisplay(plugin, trimmed.substring(4).trim(), 'pOH', container);
      } else if (trimmed.startsWith('config:')) {
        electronConfigAndDisplay(plugin, trimmed.substring(7).trim(), container);
      } else if (trimmed.startsWith('oxidation:')) {
        oxidationAndDisplay(plugin, trimmed.substring(10).trim(), container);
      } else if (trimmed.startsWith('enthalpy:')) {
        thermochemAndDisplay(plugin, trimmed.substring(9).trim(), container);
      } else if (trimmed.startsWith('Keq:')) {
        equilibriumAndDisplay(plugin, trimmed.substring(4).trim(), container);
      } else {
        // Default: render beautifully
        if (trimmed.includes('->') || trimmed.includes('<->') || trimmed.includes('<=>')) {
          renderEquation(trimmed, container);
        } else {
          renderFormula(trimmed, container);
        }
      }
    } catch (err) {
      container.createDiv({
        cls: 'chem-error',
        text: `Error: ${err instanceof Error ? err.message : String(err)}`
      });
    }
  }
}
