import { App, CachedMetadata, MarkdownView, TAbstractFile, TFile, TFolder } from 'obsidian'

class EnsureError extends Error {}

function ensure<T>(value: T, message: string): NonNullable<T> {
  if (!value) {
    throw new EnsureError(message)
  }
  return value
}

function getCurrentFile(app: App) {
  const view = app.workspace.getActiveViewOfType(MarkdownView)

  return view?.file ?? null
}

function currentFileHasBlueprint(app: App) {
  const view = app.workspace.getActiveViewOfType(MarkdownView)

  if (!view || !view.file) {
    return false
  }

  return fileHasBlueprint(app, view.file)
}

function fileHasBlueprint(app: App, file: TFile) {
  const metadata = app.metadataCache.getFileCache(file)
  const propPath = metadata?.frontmatterLinks?.find((link) => link.key === 'blueprint')

  return Boolean(propPath)
}

function findInTree(root: TFolder, predicate: (leaf: TFile) => boolean): TFile[] {
  return root.children.flatMap((leaf: TAbstractFile) => {
    if (leaf instanceof TFolder) {
      return findInTree(leaf, predicate)
    } else {
      const file = leaf as TFile
      return predicate(file) ? file : []
    }
  })
}

function findSectionsWithHeadings(metadata: CachedMetadata, contents: string) {
  const sectionsWithHeadings: Array<{ heading: string; contents: string }> = []

  for (const section of metadata.sections || []) {
    if (section.type !== 'heading' && sectionsWithHeadings.length === 0) {
      continue
    }
    if (section.type === 'heading') {
      const heading = contents
        .slice(section.position.start.offset, section.position.end.offset)
        .replace(/^#+\s+/, '')
      sectionsWithHeadings.push({ heading, contents: '' })
      continue
    }
    const lastSection = sectionsWithHeadings.at(-1)!
    const sectionContents = contents.slice(
      section.position.start.offset,
      section.position.end.offset,
    )
    lastSection.contents += `${lastSection.contents.length > 0 ? '\n\n' : ''}${sectionContents}`
  }

  return Object.fromEntries(
    sectionsWithHeadings.map((section) => [section.heading, section.contents]),
  )
}

export {
  currentFileHasBlueprint,
  ensure,
  EnsureError,
  fileHasBlueprint,
  findInTree,
  findSectionsWithHeadings,
  getCurrentFile,
}
