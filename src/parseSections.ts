import type { CachedMetadata, SectionCache } from 'obsidian'

type Section = {
  level: number
  name: string
  contents: string
  header?: string
}

/**
 * A heading as exposed to templates. Deliberately narrower than Section: contents stay
 * reachable through {% section %} so there is only one way to pull note content into a
 * blueprint.
 */
export type Heading = {
  level: number
  name: string
}

export type SectionData = {
  byName: Record<string, string>
  list: Section[]
  /**
   * Note content running from the first heading of at least the given level to the end of the
   * file, verbatim, keyed by that level. Empty when the note has no heading that deep.
   * Lets a blueprint emit a preamble containing headings of its own, as long as the note's
   * own content starts at a deeper level than anything the preamble emits.
   */
  rest: Record<number, string>
}

export const TOP_SECTION_ID = '___TOP___' as const
export const END_SECTION_ID = '___END___' as const
export const REST_SECTION_ID = '___REST___' as const
export const MAX_HEADING_LEVEL = 6 as const

function parseSections(metadata: CachedMetadata, contents: string): SectionData {
  const topSection: Section = { level: 0, name: TOP_SECTION_ID, contents: '' }
  const path: Section[] = []
  const sections: Section[] = [topSection]
  const byRef: Section[] = []
  // We always have a frontmatter since this is required for the blueprint property
  const [frontmatterSection, ...noteSections] = metadata.sections!
  let previousSectionCache: SectionCache = frontmatterSection
  // Start offset of the first heading at each level, used to build the ___REST___ pseudo-section
  const firstHeadingOffsetByLevel: (number | null)[] = new Array(MAX_HEADING_LEVEL + 1).fill(null)

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

      if (level <= MAX_HEADING_LEVEL && firstHeadingOffsetByLevel[level] === null) {
        firstHeadingOffsetByLevel[level] = sectionCache.position.start.offset
      }

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

  // The first heading of at least level N is the earliest of the first headings of every level
  // from N down, since offsets increase with document order
  const rest: Record<number, string> = {}
  for (let minLevel = 1; minLevel <= MAX_HEADING_LEVEL; minLevel++) {
    const offsets = firstHeadingOffsetByLevel
      .slice(minLevel)
      .filter((offset): offset is number => offset !== null)
    rest[minLevel] = offsets.length === 0 ? '' : contents.slice(Math.min(...offsets)).trim()
  }

  return {
    byName: Object.fromEntries(sections.map(({ name, contents }) => [name, contents.trim()])),
    list: sections,
    rest,
  }
}

/**
 * The note's headings in document order, for templates that need to inspect or iterate the
 * structure they are about to render. Excludes the top section and block references, which
 * are not headings and carry no level.
 */
function toHeadings(sectionData: SectionData): Heading[] {
  return sectionData.list
    .filter((section) => section.level > 0)
    .map(({ level, name }) => ({ level, name }))
}

export { parseSections, toHeadings }
