import { App, FuzzySuggestModal, TFile } from 'obsidian'
import * as path from 'path'
import { blueprintDisplayName } from './constants'

type MaybeBlueprint = TFile | null

class BlueprintSuggestModal extends FuzzySuggestModal<TFile> {
  private selectedBlueprint: MaybeBlueprint = null

  static async prompt(app: App, suffix: string) {
    return new Promise<MaybeBlueprint>((resolve) => {
      new BlueprintSuggestModal(app, suffix, resolve).open()
    })
  }

  constructor(
    public app: App,
    private suffix: string,
    private onFinish: (maybeBlueprint: MaybeBlueprint) => void,
  ) {
    super(app)
  }

  getItems(): TFile[] {
    // By name, not extension: `Book.blueprint.md` has extension `md`.
    return this.app.vault.getFiles().filter((file) => file.name.endsWith(this.suffix))
  }

  getItemText(blueprint: TFile): string {
    const name = blueprintDisplayName(blueprint.name, this.suffix)

    return blueprint.parent?.parent // checks wether parent is not root folder
      ? path.join(blueprint.parent.path, name)
      : name
  }

  onChooseItem(blueprint: TFile) {
    this.selectedBlueprint = blueprint
  }

  onClose(): void {
    // We add a small delay here because onClose is initially run before onChooseItem
    activeWindow.setTimeout(() => {
      this.onFinish(this.selectedBlueprint)
    }, 0)
  }
}

export { BlueprintSuggestModal }
