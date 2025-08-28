import type { App, TAbstractFile, TFile, TFolder } from 'obsidian'

class EnsureError extends Error {}

function ensure<T>(value: T, message: string): NonNullable<T> {
  if (!value) {
    throw new EnsureError(message)
  }
  return value
}

function fileHasBlueprint(app: App, file: TFile) {
  const metadata = app.metadataCache.getFileCache(file)
  const propPath = metadata?.frontmatterLinks?.find((link) => link.key === 'blueprint')

  return Boolean(propPath)
}

function findInTree(root: TFolder, predicate: (leaf: TFile) => boolean): TFile[] {
  return root.children.flatMap((leaf: TAbstractFile) => {
    if (isFolder(leaf)) {
      return findInTree(leaf, predicate)
    } else {
      const file = leaf as TFile
      return predicate(file) ? file : []
    }
  })
}

function isFolder(leaf: TAbstractFile): leaf is TFolder {
  return 'children' in leaf
}

export { ensure, EnsureError, fileHasBlueprint, findInTree }
