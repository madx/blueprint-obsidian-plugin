import { App, FuzzySuggestModal, TFile } from 'obsidian'
import * as path from 'path'
import { BLUEPRINT_FILE_EXTENSION } from './constants'

type MaybeBlueprint = TFile | null

class BlueprintSuggestModal extends FuzzySuggestModal<TFile> {
  private selectedBlueprint: MaybeBlueprint = null

  static async prompt(app: App) {
    return new Promise<MaybeBlueprint>((resolve) => {
      new BlueprintSuggestModal(app, resolve).open()
    })
  }

  constructor(
    public app: App,
    private onFinish: (maybeBlueprint: MaybeBlueprint) => void,
  ) {
    super(app)
  }

  getItems(): TFile[] {
    return this.app.vault.getFiles().filter((file) => file.extension === BLUEPRINT_FILE_EXTENSION)
  }

  getItemText(blueprint: TFile): string {
    return blueprint.parent?.parent // checks wether parent is not root folder
      ? path.join(blueprint.parent.path, blueprint.basename)
      : blueprint.basename
  }

  onChooseItem(blueprint: TFile) {
    this.selectedBlueprint = blueprint
  }

  onClose(): void {
    // We add a small delay here because onClose is initially run before onChooseItem
    setTimeout(() => {
      this.onFinish(this.selectedBlueprint)
    }, 0)
  }
}

export { BlueprintSuggestModal }
