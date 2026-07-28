import * as nunjucks from 'nunjucks'
import { END_SECTION_ID, MAX_HEADING_LEVEL, REST_SECTION_ID, SectionData } from './parseSections'

/**
 * This file is poorly typed, mainly because nunjucks' parser API is also poorly typed
 */

class SectionExtension {
  sectionData: SectionData
  tags = ['section']

  constructor(sectionData: SectionData) {
    this.sectionData = sectionData
  }

  // nunjucks' parser API is undocumented so we don't get type info here
  parse(parser: any, nodes: any) {
    const tok = parser.nextToken()

    const args = parser.parseSignature(null, true)
    parser.advanceAfterBlockEnd(tok.value)

    const body = parser.parseUntilBlocks('endsection')

    parser.advanceAfterBlockEnd()

    return new nodes.CallExtension(this, 'run', args, [body])
  }

  run(
    _: any,
    startName: string,
    endName: string | number | (() => string),
    defaultContent?: () => string,
  ): nunjucks.runtime.SafeString {
    if (defaultContent === undefined && typeof endName === 'function') {
      defaultContent = endName
    }

    // ___REST___ is a pseudo-section: everything from the note's first heading to the end of
    // the file, verbatim. Unlike a section range it does not filter by heading level, so the
    // note is free to use whatever heading structure it likes below the blueprint's preamble.
    // An optional second argument sets the level to anchor on, so that a preamble emitting
    // headings of its own (a title H1, say) can sit above the note's own content.
    if (startName === REST_SECTION_ID) {
      const requestedLevel = typeof endName === 'number' ? endName : 1
      const minLevel = Math.min(Math.max(Math.trunc(requestedLevel), 1), MAX_HEADING_LEVEL)

      return new nunjucks.runtime.SafeString(
        this.sectionData.rest[minLevel] || defaultContent?.().trim() || '',
      )
    }

    const getSection = (startName: string, defaultContent: string) => {
      return this.sectionData.byName[startName] || defaultContent
    }
    const getSectionRange = (startName: string, endName: string, defaultContent: string) => {
      const sectionList = this.sectionData.list
      const firstSectionIndex = sectionList.findIndex((section) => section.name === startName)
      const lastSectionIndex =
        endName === END_SECTION_ID
          ? sectionList.length
          : sectionList.findIndex((section) => section.name === endName)

      if (firstSectionIndex < 0 || lastSectionIndex < 0) {
        return defaultContent
      }

      const firstSectionLevel = sectionList[firstSectionIndex].level
      return sectionList
        .slice(firstSectionIndex, lastSectionIndex)
        .filter((section) => section.level === firstSectionLevel)
        .map((section, index) =>
          index === 0 ? section.contents : [section.header, section.contents].join(''),
        )
        .join('')
        .trim()
    }

    if (typeof endName === 'string') {
      return new nunjucks.runtime.SafeString(
        getSectionRange(startName, endName, defaultContent?.().trim() || ''),
      )
    } else {
      return new nunjucks.runtime.SafeString(getSection(startName, defaultContent?.().trim() || ''))
    }
  }
}

export { SectionExtension }
