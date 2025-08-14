import * as nunjucks from 'nunjucks'
import { Plugin, TFile, TFolder } from 'obsidian'
import { executeFileBlueprint, executeFolderBlueprints } from './commands'
import { fileHasBlueprint } from './utils'

export default class BlueprintPlugin extends Plugin {
  async onload() {
    nunjucks.configure({ autoescape: false, trimBlocks: true })

    this.registerEvent(
      this.app.workspace.on('file-menu', (menu, file) => {
        if (file instanceof TFolder) {
          menu.addItem((item) => {
            item
              .setTitle('Apply all Blueprints')
              .setIcon('layout-dashboard')
              .onClick(async () => executeFolderBlueprints(this.app, file))
          })
        }
        if (file instanceof TFile && fileHasBlueprint(this.app, file)) {
          menu.addItem((item) => {
            item
              .setTitle('Apply Blueprint')
              .setIcon('layout-dashboard')
              .onClick(async () => executeFileBlueprint(this.app, file))
          })
        }
      }),
    )

    this.addCommand({
      id: 'execute-current-file-blueprint',
      name: "Execute current file's Blueprint",
      checkCallback: (checking: boolean) => {
        const file = this.app.workspace.getActiveFile()

        if (checking) {
          return file ? fileHasBlueprint(this.app, file) : false
        }

        if (!file) {
          return false
        }

        executeFileBlueprint(this.app, file)
        return true
      },
    })
  }
}
