import * as nunjucks from 'nunjucks'
import { Plugin, TFile, TFolder } from 'obsidian'
import { BlueprintView, VIEW_TYPE_BLUEPRINT } from './BlueprintView'
import {
  createNoteFromBlueprint,
  createNoteFromBlueprintInFolder,
  executeFileBlueprint,
  executeFolderBlueprints,
  updateBlueprintNotes,
} from './commands'
import { BLUEPRINT_FILE_EXTENSION } from './constants'
import { fileHasBlueprint, fileIsBlueprint } from './utils'

export default class BlueprintPlugin extends Plugin {
  async onload() {
    nunjucks.configure({ autoescape: false, trimBlocks: true })

    this.registerEvent(
      this.app.workspace.on('file-menu', (menu, file) => {
        if (file instanceof TFolder) {
          menu.addItem((item) => {
            item
              .setTitle('Update all notes with blueprints')
              .onClick(async () => executeFolderBlueprints(this.app, file))
          })
          menu.addItem((item) => {
            item
              .setTitle('Create new note from blueprint')
              .onClick(async () => createNoteFromBlueprintInFolder(this.app, file.path))
          })
        }
        if (file instanceof TFile && fileHasBlueprint(this.app, file)) {
          menu.addItem((item) => {
            item
              .setTitle('Apply blueprint')
              .onClick(async () => executeFileBlueprint(this.app, file))
          })
        }
        if (file instanceof TFile && fileIsBlueprint(file)) {
          menu.addItem((item) => {
            item
              .setTitle('Update notes using this blueprint')
              .onClick(async () => updateBlueprintNotes(this.app, file))
          })
        }
      }),
    )

    this.addCommand({
      id: 'apply-blueprint',
      name: 'Apply blueprint',
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
      id: 'apply-blueprints-in-all-notes-in-vault',
      name: 'Apply blueprint in all notes in vault',
      callback: async () => {
        const root = this.app.vault.getRoot()
        await executeFolderBlueprints(this.app, root)
      },
    })

    this.addCommand({
      id: 'create-note-from-blueprint',
      name: 'Create new note from blueprint',
      callback: () => {
        createNoteFromBlueprint(this.app)
      },
    })

    this.addCommand({
      id: 'update-notes-using-blueprint',
      name: 'Update notes using this blueprint',
      checkCallback: (checking: boolean) => {
        const file = this.app.workspace.getActiveFile()

        if (file && fileIsBlueprint(file)) {
          if (!checking) {
            updateBlueprintNotes(this.app, file)
          }
          return true
        }

        return false
      },
    })

    this.registerView(VIEW_TYPE_BLUEPRINT, (leaf) => new BlueprintView(leaf))
    this.registerExtensions([BLUEPRINT_FILE_EXTENSION], VIEW_TYPE_BLUEPRINT)
  }
}
