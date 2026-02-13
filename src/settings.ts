import { App, PluginSettingTab, Setting } from 'obsidian';
import type ChemistryPlugin from './main';

export interface ChemistryPluginSettings {
  decimalPlaces: number;
  enableInlineRendering: boolean;
  showElementBreakdown: boolean;
  renderArrows: boolean;
  showCalculationSteps: boolean;
  showNobleGasCore: boolean;
}

export const DEFAULT_SETTINGS: ChemistryPluginSettings = {
  decimalPlaces: 3,
  enableInlineRendering: true,
  showElementBreakdown: true,
  renderArrows: true,
  showCalculationSteps: true,
  showNobleGasCore: true,
};

export class ChemistrySettingTab extends PluginSettingTab {
  plugin: ChemistryPlugin;

  constructor(app: App, plugin: ChemistryPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl('h2', { text: 'Chemistry Plugin Settings' });

    new Setting(containerEl)
      .setName('Decimal places')
      .setDesc('Number of decimal places for calculation results')
      .addSlider(slider => slider
        .setLimits(0, 6, 1)
        .setValue(this.plugin.settings.decimalPlaces)
        .setDynamicTooltip()
        .onChange(async (value) => {
          this.plugin.settings.decimalPlaces = value;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName('Inline chemistry rendering')
      .setDesc('Render `chem:H2O` inline code as formatted chemistry')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.enableInlineRendering)
        .onChange(async (value) => {
          this.plugin.settings.enableInlineRendering = value;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName('Show element breakdown')
      .setDesc('Show per-element mass breakdown in molar mass calculations')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.showElementBreakdown)
        .onChange(async (value) => {
          this.plugin.settings.showElementBreakdown = value;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName('Render reaction arrows')
      .setDesc('Convert -> to arrow symbols and render state symbols')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.renderArrows)
        .onChange(async (value) => {
          this.plugin.settings.renderArrows = value;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName('Show calculation steps')
      .setDesc('Display intermediate steps in calculations (stoichiometry, gas law, pH, etc.)')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.showCalculationSteps)
        .onChange(async (value) => {
          this.plugin.settings.showCalculationSteps = value;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName('Noble gas core abbreviation')
      .setDesc('Use [Ar], [Kr], etc. in electron configurations')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.showNobleGasCore)
        .onChange(async (value) => {
          this.plugin.settings.showNobleGasCore = value;
          await this.plugin.saveSettings();
        })
      );
  }
}
