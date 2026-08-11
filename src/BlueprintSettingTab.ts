import { App, PluginSettingTab, Setting } from 'obsidian'
import BlueprintPlugin from './'
import { DEFAULT_BLUEPRINT_SUFFIX, LEGACY_BLUEPRINT_SUFFIX } from './constants'

class BlueprintSettingTab extends PluginSettingTab {
  plugin: BlueprintPlugin

  constructor(app: App, plugin: BlueprintPlugin) {
    super(app, plugin)
    this.plugin = plugin
  }

  display(): void {
    let { containerEl } = this

    containerEl.empty()

    new Setting(containerEl).setName('Blueprint files').setHeading()
    new Setting(containerEl)
      .setName('Blueprint filename suffix')
      .setDesc(
        `How a blueprint is recognised. The default ${DEFAULT_BLUEPRINT_SUFFIX} keeps blueprints ` +
          `as ordinary markdown notes, so they sync, render and open like everything else. ` +
          `Use ${LEGACY_BLUEPRINT_SUFFIX} for standalone files with the plugin's own editor. ` +
          `Existing files are not renamed, and changing this needs a restart to take effect.`,
      )
      .addText((text) =>
        text
          .setPlaceholder(DEFAULT_BLUEPRINT_SUFFIX)
          .setValue(this.plugin.settings.blueprintSuffix)
          .onChange(async (value) => {
            // Stored verbatim so a half-typed suffix isn't rewritten under the caret;
            // every reader goes through `plugin.suffix`, which falls back when invalid.
            this.plugin.settings.blueprintSuffix = value
            await this.plugin.saveSettings()
          }),
      )

    new Setting(containerEl).setName('Experimental features').setHeading()
    new Setting(containerEl)
      .setName('Enable syntax highlighting in Blueprint files')
      .setDesc(
        `Applies to the plugin's own editor, which is only used for a non-markdown ` +
          `suffix such as ${LEGACY_BLUEPRINT_SUFFIX}. Markdown blueprints open in ` +
          `Obsidian's editor and are unaffected.`,
      )
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.experimentalHasBlueprintSyntaxHighlight)
          .onChange(async (value) => {
            this.plugin.settings.experimentalHasBlueprintSyntaxHighlight = value
            await this.plugin.saveSettings()
          }),
      )
  }
}

export { BlueprintSettingTab }
