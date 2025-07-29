import { CachedMetadata } from "obsidian"

function findSectionsWithHeadings(metadata: CachedMetadata, contents: string) {
  const sectionsWithHeadings: Array<{ heading: string, contents: string }> = []

  for (const section of (metadata.sections || [])) {
    if (section.type !== "heading" && sectionsWithHeadings.length === 0) {
      continue
    }
    if (section.type === "heading") {
      const heading = contents.slice(section.position.start.offset, section.position.end.offset).replace(/^#+\s+/, "")
      sectionsWithHeadings.push({ heading, contents: "" })
      continue
    }
    const lastSection = sectionsWithHeadings.at(-1)!
    const sectionContents = contents.slice(section.position.start.offset, section.position.end.offset)
    lastSection.contents += `${lastSection.contents.length > 0 ? "\n\n" : ''}${sectionContents}`

  }

  return Object.fromEntries(sectionsWithHeadings.map((section) => [section.heading, section.contents]))
}

export { findSectionsWithHeadings }
