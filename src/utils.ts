import { Template } from 'nunjucks'
import type { App, TAbstractFile, TFile, TFolder } from 'obsidian'

class EnsureError extends Error {}

const BLUEPRINT_FILE_EXTENSION = 'blueprint' as const

function ensure<T>(value: T, message: string): NonNullable<T> {
  if (!value) {
    throw new EnsureError(message)
  }
  return value
}

function fileIsBlueprint(file: TFile) {
  return file.extension === BLUEPRINT_FILE_EXTENSION
}

function fileHasBlueprint(app: App, file: TFile, blueprint?: TFile) {
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
