import * as nunjucks from 'nunjucks'
import { TargetFile } from './targetFile'
import { END_SECTION_ID, parseSectionData, SectionData } from './sectionData'

/**
 * This file is poorly typed, mainly because nunjucks' parser API is also poorly typed.
 * Thus, it is not tested.
 */

export class SectionExtension {
  sectionData: SectionData
  tags = ['section', 'chunk']

  constructor(targetFile: TargetFile) {
    this.sectionData = parseSectionData(targetFile)
  }

  // nunjucks' parser API is undocumented so we don't get type info here
  parse(parser: any, nodes: any) {
    const tok = parser.nextToken()

    const endTag = `end${tok.value}`
    const runMethod = tok.value === 'section' ? 'runSection' : 'runChunk'

    const args = parser.parseSignature(null, true)
    parser.advanceAfterBlockEnd(tok.value)

    const body = parser.parseUntilBlocks(endTag)

    parser.advanceAfterBlockEnd()

    return new nodes.CallExtension(this, runMethod, args, [body])
  }

  runSection(
    _: any,
    startName: string,
    endName: string | (() => string),
    optionalDefaultContent?: () => string,
  ): nunjucks.runtime.SafeString {
    // endName is actually optionalDefaultContent when the section block was only passed a startName
    if (optionalDefaultContent === undefined && typeof endName === 'function') {
      optionalDefaultContent = endName
    }

    const defaultContent = optionalDefaultContent?.().trim() || ''

    const result =
      typeof endName === 'string'
        ? this.getSectionRange(startName, endName, defaultContent)
        : this.getSection(startName, defaultContent)

    return new nunjucks.runtime.SafeString(result)
  }

  runChunk(
    _: any,
    chunkName: string,
    optionalDefaultContent?: () => string,
  ): nunjucks.runtime.SafeString {
    // endName is actually optionalDefaultContent when the section block was only passed a startName
    const defaultContent = optionalDefaultContent?.().trim() || ''
    const result = this.getChunk(chunkName, defaultContent)
    return new nunjucks.runtime.SafeString(result)
  }

  /**
   * Private methods
   */

  private getChunk(chunkName: string, defaultContent: string) {
    const section = this.sectionData.list.find((section) => section.name === chunkName)

    return section?.chunk.trim() || defaultContent
  }

  private getSection(startName: string, defaultContent: string) {
    return this.sectionData.byName[startName] || defaultContent
  }

  private getSectionRange(startName: string, endName: string, defaultContent: string) {
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
}
