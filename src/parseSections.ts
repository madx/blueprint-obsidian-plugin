import type { CachedMetadata, SectionCache } from 'obsidian'

type Section = {
  level: number
  name: string
  contents: string
  header?: string
}

export type SectionData = {
  byName: Record<string, string>
  list: Section[]
}

export const TOP_SECTION_ID = '___TOP___' as const

function parseSections(metadata: CachedMetadata, contents: string): SectionData {
  const topSection: Section = { level: 0, name: TOP_SECTION_ID, contents: '' }
  const path: Section[] = []
  const sections: Section[] = [topSection]
  const byRef: Section[] = []
  // We always have a frontmatter since this is required for the blueprint property
  const [frontmatterSection, ...noteSections] = metadata.sections!
  let previousSectionCache: SectionCache = frontmatterSection

  for (const sectionCache of noteSections) {
    if (sectionCache.id && sectionCache.type !== 'heading') {
      const markdown = contents
        .slice(previousSectionCache.position.end.offset, sectionCache.position.end.offset)
        .trim()
      sections.push({ level: 0, name: sectionCache.id, contents: markdown })
      previousSectionCache = sectionCache
      continue
    }

    if (sectionCache.type === 'heading') {
      // We split a header on spaces, first element are the # signs, then a variable length space
      // then the actual heading that we join back, keeping its original spacing
      const markdown = contents.slice(
        previousSectionCache.position.end.offset,
        sectionCache.position.end.offset,
      )
      const [hashes, _, ...headingParts] = markdown.trim().split(/(\s+)/)
      const level = hashes.length
      const name = headingParts.join('')

      const newSection: Section = { level, name, contents: '', header: markdown }
      const previousSection = path.at(-1)

      sections.push(newSection)

      if (!previousSection) {
        path.push(newSection)
        previousSectionCache = sectionCache
        continue
      }

      if (previousSection.level > newSection.level) {
        while (path.length && (path.at(-1)?.level || 0) >= newSection.level) {
          path.pop()
        }
      } else if (previousSection.level === newSection.level) {
        path.pop()
      }

      for (const parentSection of path) {
        parentSection.contents += markdown
      }
      path.push(newSection)

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
        parentSection.contents += sectionContents
      }
    }
    previousSectionCache = sectionCache
  }

  return {
    byName: Object.fromEntries(sections.map(({ name, contents }) => [name, contents.trim()])),
    list: sections,
  }
}

export { parseSections }
