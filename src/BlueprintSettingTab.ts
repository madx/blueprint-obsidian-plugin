import { App, PluginSettingTab, Setting } from 'obsidian'
import BlueprintPlugin from 'src'

class BlueprintSettingTab extends PluginSettingTab {
  plugin: BlueprintPlugin

  constructor(app: App, plugin: BlueprintPlugin) {
    super(app, plugin)
    this.plugin = plugin
  }

  display(): void {
    let { containerEl } = this

    containerEl.empty()

    new Setting(containerEl).setName('Experimental features').setHeading()
    new Setting(containerEl)
      .setName('Enable syntax highlighting in Blueprint files')
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
