import * as nunjucks from 'nunjucks'
import { END_SECTION_ID, SectionData } from './parseSections'

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
    endName: string | (() => string),
    defaultContent?: () => string,
  ): nunjucks.runtime.SafeString {
    if (defaultContent === undefined && typeof endName === 'function') {
      defaultContent = endName
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
