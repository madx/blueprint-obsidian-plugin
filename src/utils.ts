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

function fileHasBlueprint(app: App, file: TFile) {
  const metadata = app.metadataCache.getFileCache(file)
  const propPath = metadata?.frontmatterLinks?.find((link) => link.key === 'blueprint')

  return Boolean(propPath)
}

function findInTree(root: TFolder, predicate: (leaf: TFile) => boolean): TFile[] {
  return root.children.flatMap((leaf: TFile | TFolder) => {
    if (isFolder(leaf)) {
      return findInTree(leaf, predicate)
    } else {
      return predicate(leaf) ? leaf : []
    }
  })
}

function isFolder(leaf: TAbstractFile): leaf is TFolder {
  return 'children' in leaf
}

export { ensure, EnsureError, fileHasBlueprint, fileIsBlueprint, findInTree }
