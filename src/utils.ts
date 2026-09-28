import { type App, type TAbstractFile, type TFile, type TFolder } from 'obsidian'

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

function isWikiLink(string: string) {
  return string.startsWith('[[') && string.endsWith(']]') && string.length > 4
}

function joinPath(folderPath: string, filePath: string) {
  return folderPath.endsWith('/') ? folderPath + filePath : `${folderPath}/${filePath}`
}

function safeMerge(
  left: Record<string, unknown>,
  right: Record<string, unknown>,
): Record<string, unknown> {
  const missingFromLeft = Object.fromEntries(
    Object.entries(right).filter(([key]) => !(key in left)),
  )

  const mergedLeft = Object.fromEntries(
    Object.entries(left).map(([key, leftValue]) => {
      const rightValue = right[key]

      if (typeof leftValue === 'object' && typeof rightValue === 'object') {
        if (Array.isArray(leftValue) && Array.isArray(rightValue)) {
          return [key, [...new Set([...leftValue, ...rightValue])]]
        }
        return [
          key,
          safeMerge(leftValue as Record<string, unknown>, rightValue as Record<string, unknown>),
        ]
      }

      return [key, leftValue]
    }),
  )

  return Object.assign({}, mergedLeft, missingFromLeft)
}

function unwikilink(wikilink: string) {
  return isWikiLink(wikilink) ? wikilink.slice(2, -2).split('|').at(0)! : wikilink
}

export {
  EnsureError,
  ensure,
  fileHasBlueprint,
  fileIsBlueprint,
  findInTree,
  isWikiLink,
  joinPath,
  safeMerge,
  unwikilink,
}
