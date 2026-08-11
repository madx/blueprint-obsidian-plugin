import { Template } from 'nunjucks'
import type { App, TAbstractFile, TFile, TFolder } from 'obsidian'

class EnsureError extends Error {}

function ensure<T>(value: T, message: string): NonNullable<T> {
  if (!value) {
    throw new EnsureError(message)
  }
  return value
}

/**
 * Tests the file **name**, not `file.extension`: the default suffix is
 * `.blueprint.md`, whose extension is `md`. Works for a non-markdown
 * `.blueprint` too, since that name also ends with its suffix.
 */
function fileIsBlueprint(file: TFile, suffix: string) {
  return file.name.endsWith(suffix)
}

/**
 * A blueprint is never a note *with* a blueprint, even when it links to one.
 *
 * This mattered little while blueprints were non-markdown — nothing indexed them,
 * so they never turned up in a folder walk or in `resolvedLinks`. As `.md` they are
 * ordinary notes: a blueprint whose frontmatter template contains a `blueprint:`
 * line would otherwise be picked up by "update all notes in this folder" and
 * rendered into itself, destroying the template.
 */
function fileHasBlueprint(app: App, file: TFile, suffix: string, blueprint?: TFile) {
  if (fileIsBlueprint(file, suffix)) return false

  const metadata = app.metadataCache.getFileCache(file)
  const propPath = metadata?.frontmatterLinks?.find((link) => link.key === 'blueprint')

  if (blueprint && propPath) {
    const target = app.metadataCache.getFirstLinkpathDest(propPath.link, file.path)

    return target?.path === blueprint.path
  }

  return Boolean(propPath)
}

function findInTree(root: TFolder, predicate: (leaf: TFile) => boolean): TFile[] {
  return root.children.flatMap((leaf: TAbstractFile) => {
    if (isFolder(leaf)) {
      return findInTree(leaf, predicate)
    } else {
      const fileLeaf = leaf as TFile
      return predicate(fileLeaf) ? fileLeaf : []
    }
  })
}

function isFolder(leaf: TAbstractFile): leaf is TFolder {
  return 'children' in leaf
}

async function renderTemplate(template: Template, context: Record<string, unknown>) {
  return new Promise<string>((resolve, reject) => {
    template.render(context, (err: unknown, result: string | null) => {
      if (err) {
        return reject(err)
      }

      return resolve(result || '')
    })
  })
}

export { ensure, EnsureError, fileHasBlueprint, fileIsBlueprint, findInTree, renderTemplate }
