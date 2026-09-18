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

function joinPath(folderPath: string, filePath: string) {
  return folderPath.endsWith('/') ? folderPath + filePath : `${folderPath}/${filePath}`
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

function safeMerge(
  left: Record<string, unknown>,
  right: Record<string, unknown>,
): Record<string, unknown> {
  if (left === null || right === null) {
    return left ?? right
  }

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

export {
  ensure,
  EnsureError,
  fileHasBlueprint,
  fileIsBlueprint,
  findInTree,
  joinPath,
  renderTemplate,
  safeMerge,
}
