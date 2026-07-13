import { jinja } from '@codemirror/lang-jinja'
import { RangeSetBuilder, StateEffect } from '@codemirror/state'
import {
  Decoration,
  DecorationSet,
  EditorView,
  PluginValue,
  ViewPlugin,
  ViewUpdate,
} from '@codemirror/view'
import { Tree, TreeFragment } from '@lezer/common'
import { MarkdownView, TFile, WorkspaceLeaf } from 'obsidian'

const VIEW_TYPE_BLUEPRINT = 'blueprint'

const jinjaSupport = jinja()

const TAG_STYLES = Object.fromEntries(
  Object.entries({
    keyword:
      'TagName raw endraw filter endfilter as trans pluralize endtrans with endwith autoescape endautoescape if elif else endif for endfor call endcall block endblock set endset macro endmacro import from include',
    variable:
      'VariableName Definition PropertyName required scoped recursive without context ignore missing loop super',
    function: 'FilterName',
    operator: 'ArithOp AssignOp CompareOp not and or in is',
    punctuation: 'FilterOp ConcatOp {% %} {# #} {{ }} { } ( ) . : , .',
    string: 'StringLiteral',
    number: 'NumberLiteral',
    boolean: 'BooleanLiteral',
  }).flatMap(([style, tags]) => tags.split(' ').map((tag) => [tag, style])),
)

class BlueprintHighlighter implements PluginValue {
  decorations: DecorationSet
  tree: Tree
  fragments: readonly TreeFragment[] = []

  constructor(view: EditorView) {
    this.tree = jinjaSupport.language.parser.parse(view.state.doc.toString())
    this.fragments = TreeFragment.addTree(this.tree)
    this.decorations = this.buildDecorations() ?? Decoration.none
  }

  buildDecorations(): DecorationSet {
    const builder = new RangeSetBuilder<Decoration>()

    const node = this.tree.cursor()
    while (node.next()) {
      builder.add(
        node.from,
        node.to,
        Decoration.mark({ attributes: { bpToken: `BP-${node.name}` } }),
      )

      const style = TAG_STYLES[node.name]
      if (style) {
        builder.add(node.from, node.to, Decoration.mark({ class: `token ${style}` }))
      }
    }

    return builder.finish()
  }

  update(update: ViewUpdate) {
    const tree = jinjaSupport.language.parser.parse(update.state.doc.toString(), this.fragments)
    if (tree.length < update.view.viewport.to || update.view.composing)
      this.decorations = this.decorations.map(update.changes)
    else if (tree != this.tree || update.viewportChanged || update.selectionSet) {
      this.tree = tree
      this.fragments = TreeFragment.addTree(this.tree, this.fragments)
      this.decorations = this.buildDecorations() ?? Decoration.none
    }
  }
}

const nunjucksHighlightingPlugin = ViewPlugin.fromClass(BlueprintHighlighter, {
  decorations: (plugin: BlueprintHighlighter) => plugin.decorations,
})

class BlueprintExtendedView extends MarkdownView {
  constructor(leaf: WorkspaceLeaf) {
    super(leaf)
  }

  getViewType(): string {
    return VIEW_TYPE_BLUEPRINT
  }

  async onLoadFile(file: TFile) {
    await super.onLoadFile(file)

    if (this.getMode() === 'source') {
      // @ts-expect-error
      this.currentMode.sourceMode = false
      // @ts-expect-error
      this.currentMode.toggleSource()
    }

    activeWindow.setTimeout(() => {
      // @ts-expect-error
      const cm = this.editor.cm as EditorView
      cm.dispatch({
        effects: StateEffect.appendConfig.of([jinjaSupport, nunjucksHighlightingPlugin]),
      })
    }, 200)
  }
}

export { BlueprintExtendedView, VIEW_TYPE_BLUEPRINT }
