import { MarkdownView, WorkspaceLeaf } from 'obsidian'

const VIEW_TYPE_BLUEPRINT = 'blueprint'

class BlueprintView extends MarkdownView {
  constructor(leaf: WorkspaceLeaf) {
    super(leaf)
  }

  getViewType(): string {
    return VIEW_TYPE_BLUEPRINT
  }

  getDisplayText(): string {
    return this.file?.basename || 'Blueprint'
  }
}

export { BlueprintView, VIEW_TYPE_BLUEPRINT }
