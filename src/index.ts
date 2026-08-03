import * as nunjucks from 'nunjucks'
import { Menu, Plugin, TFile, TFolder } from 'obsidian'
import { BlueprintExtendedView, VIEW_TYPE_BLUEPRINT } from './BlueprintExtendedView'
import { BlueprintSettingTab } from './BlueprintSettingTab'
import { BlueprintView } from './BlueprintView'
import {
  applyBlueprintToFile,
  createBlueprint,
  createBlueprintInFolder,
  createNoteFromBlueprint,
  createNoteFromBlueprintInFolder,
  executeFileBlueprint,
  executeFolderBlueprint,
  executeFolderBlueprints,
  updateBlueprintNotes,
} from './commands'
import { BLUEPRINT_FILE_EXTENSION } from './constants'
import { EnsureError, fileHasBlueprint, fileIsBlueprint } from './utils'

interface BlueprintPluginSettings {
  experimentalHasBlueprintSyntaxHighlight: boolean
}

const DEFAULT_SETTINGS: Partial<BlueprintPluginSettings> = {
  experimentalHasBlueprintSyntaxHighlight: false,
}

export { EnsureError } from './utils'

export interface BlueprintPluginApi {
  /**
   * Apply the blueprint linked in the note's `blueprint` frontmatter property,
   * without requiring the note to be open or active. Resolves once the note
   * has been updated.
   *
   * The note's metadata must already be indexed: if the note was just created
   * or modified, wait for the metadata cache to reflect the change (e.g. via
   * `metadataCache.on('changed', ...)`) before calling, otherwise the call
   * rejects — or renders from stale metadata.
   *
   * Rejects with `EnsureError` when a precondition fails (no blueprint link,
   * blueprint not resolvable, no cached metadata, note changed while
   * rendering, plugin not loaded), and with the underlying template error
   * when rendering fails.
   */
  applyToFile: (file: TFile) => Promise<void>

  /**
   * The error class used for precondition failures, exposed here so
   * consumers can branch with `instanceof` (class and export names are
   * not reachable across plugin bundles).
   */
  EnsureError: typeof EnsureError
}

export default class BlueprintPlugin extends Plugin {
  declare settings: BlueprintPluginSettings

  private isReady = false

  readonly api: BlueprintPluginApi = {
    applyToFile: async (file) => {
      if (!this.isReady) {
        throw new EnsureError('Blueprint plugin is not loaded')
      }
      return applyBlueprintToFile(this.app, file)
    },
    EnsureError,
  }

  async onload() {
    await this.loadSettings()

    this.addSettingTab(new BlueprintSettingTab(this.app, this))
    nunjucks.configure({ autoescape: false, trimBlocks: true })

    this.registerEvent(
      this.app.workspace.on('file-menu', (menu, file) => {
        menu.addItem((item) => {
          item.setTitle('Blueprint').setIcon('layout')

          // @ts-ignore
          const subMenu: Menu = item.setSubmenu()

          if (file instanceof TFolder) {
            subMenu.addItem((item) => {
              item
                .setTitle('New blueprint')
                .onClick(async () => createBlueprintInFolder(this.app, file.path))
            })
            subMenu.addItem((item) => {
              item
                .setTitle('New note from blueprint')
                .onClick(async () => createNoteFromBlueprintInFolder(this.app, file.path))
            })
            subMenu.addItem((item) => {
              item
                .setTitle('Update all notes with blueprints')
                .onClick(async () => executeFolderBlueprints(this.app, file))
            })
            subMenu.addItem((item) => {
              item
                .setTitle('Update all notes using specific blueprint')
                .onClick(async () => executeFolderBlueprint(this.app, file))
            })
          }
          if (file instanceof TFile && fileHasBlueprint(this.app, file)) {
            subMenu.addItem((item) => {
              item
                .setTitle('Apply blueprint')
                .onClick(async () => executeFileBlueprint(this.app, file, true))
            })
          }
          if (file instanceof TFile && fileIsBlueprint(file)) {
            subMenu.addItem((item) => {
              item
                .setTitle('Update notes using this blueprint')
                .onClick(async () => updateBlueprintNotes(this.app, file))
            })
          }
        })
      }),
    )

    this.addCommand({
      id: 'apply-blueprint',
      name: 'Apply blueprint',
      checkCallback: (checking: boolean) => {
        const file = this.app.workspace.getActiveFile()

        if (file && fileHasBlueprint(this.app, file)) {
          if (!checking) {
            void executeFileBlueprint(this.app, file, true)
          }
          return true
        }

        return false
      },
    })

    this.addCommand({
      id: 'apply-blueprints-in-all-notes-in-vault',
      name: 'Apply blueprints in all notes in vault',
      callback: async () => {
        const root = this.app.vault.getRoot()
        await executeFolderBlueprints(this.app, root)
      },
    })

    this.addCommand({
      id: 'create-blueprint',
      name: 'Create new blueprint',
      callback: () => {
        void createBlueprint(this.app)
      },
    })

    this.addCommand({
      id: 'create-note-from-blueprint',
      name: 'Create new note from blueprint',
      callback: () => {
        void createNoteFromBlueprint(this.app)
      },
    })

    this.addCommand({
      id: 'update-notes-using-blueprint',
      name: 'Update notes using this blueprint',
      checkCallback: (checking: boolean) => {
        const file = this.app.workspace.getActiveFile()

        if (file && fileIsBlueprint(file)) {
          if (!checking) {
            void updateBlueprintNotes(this.app, file)
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
          } catch (_: unknown) {
            const dumpFile = this.app.vault.getFileByPath(dumpFileName)!
            await this.app.vault.modify(dumpFile, JSON.stringify(cachedMetadata, null, 2))
          }
        }
      },
    })

    this.registerExtensions([BLUEPRINT_FILE_EXTENSION], VIEW_TYPE_BLUEPRINT)
    this.registerView(VIEW_TYPE_BLUEPRINT, (leaf) =>
      this.settings.experimentalHasBlueprintSyntaxHighlight
        ? new BlueprintExtendedView(leaf)
        : new BlueprintView(leaf),
    )

    this.isReady = true
  }

  onunload() {
    this.isReady = false
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData())
  }

  async saveSettings() {
    await this.saveData(this.settings)
  }
}
