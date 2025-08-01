import {
  App,
  CachedMetadata,
  MarkdownView,
  SectionCache,
  TAbstractFile,
  TFile,
  TFolder,
} from 'obsidian'

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

type Section = {
  level: number
  heading: string
  contents: string
}

const TOP_SECTION_ID = '___TOP___' as const

function groupSectionsByHeading(metadata: CachedMetadata, contents: string) {
  const topSection: Section = { level: 0, heading: TOP_SECTION_ID, contents: '' }
  const path: Section[] = []
  const byHeading: Section[] = [topSection]
  // We always have a frontmatter since this is required for the blueprint property
  const frontmatterSection = metadata?.sections?.shift() as SectionCache
  let previousSectionCache: SectionCache = frontmatterSection

  for (const sectionCache of metadata.sections || []) {
    if (sectionCache.type === 'heading') {
      // We split a header on spaces, first element are the # signs, then a variable length space
      // then the actual heading that we join back, keeping its original spacing
      const markdown = contents.slice(
        previousSectionCache.position.end.offset,
        sectionCache.position.end.offset,
      )
      const [hashes, _, ...headingParts] = markdown.trim().split(/(\s+)/)
      const level = hashes.length
      const heading = headingParts.join('')

      const newSection: Section = { level, heading, contents: '' }
      const previousSection = path.at(-1)

      byHeading.push(newSection)

      if (!previousSection) {
        path.push(newSection)
      } else if (previousSection.level < newSection.level) {
        for (const parentSection of path) {
          parentSection.contents += markdown
        }
        path.push(newSection)
      } else if (previousSection.level === newSection.level) {
        path.pop()
        for (const parentSection of path) {
          parentSection.contents += markdown
        }
        path.push(newSection)
      } else {
        while (path.length && (path.pop()?.level || 0) > newSection.level) {}
        path.push(newSection)
      }

      previousSectionCache = sectionCache
      continue
    }

    const sectionContents = contents.slice(
      previousSectionCache.position.end.offset,
      sectionCache.position.end.offset,
    )
    if (path.length === 0) {
      // If we have no previous headings, it means we are still in the top section
      topSection.contents += sectionContents
    } else {
      for (const parentSection of path) {
        const lastSection = byHeading.at(-1) as Section // We always have at least one section
        parentSection.contents += sectionContents
      }
    }
    previousSectionCache = sectionCache
  }

  return Object.fromEntries(byHeading.map(({ heading, contents }) => [heading, contents.trim()]))
}

export {
  currentFileHasBlueprint,
  ensure,
  EnsureError,
  fileHasBlueprint,
  findInTree,
  getCurrentFile,
  groupSectionsByHeading,
}
