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

        if (file && fileHasBlueprint(this.app, file)) {
          if (!checking) {
            executeFileBlueprint(this.app, file)
          }
          return true
        }

        return false
      },
    })

    this.addCommand({
      id: 'dump-cached-metadata',
      name: "Dump current file's CachedMetadata",
      callback: async () => {
        const file = this.app.workspace.getActiveFile()

        if (file) {
          const cachedMetadata = this.app.metadataCache.getFileCache(file)
          const dumpFileName = `${file.path.replace(/\.md$/, '.json')}`
          try {
            await this.app.vault.create(dumpFileName, JSON.stringify(cachedMetadata, null, 2))
          } catch (error: unknown) {
            const dumpFile = this.app.vault.getFileByPath(dumpFileName)!
            await this.app.vault.modify(dumpFile, JSON.stringify(cachedMetadata, null, 2))
          }
        }
      },
    })
  }
}
