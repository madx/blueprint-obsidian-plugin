import * as nunjucks from 'nunjucks'
import { END_SECTION_ID, SectionData } from './parseSections'

/**
 * This file is poorly typed, mainly because nunjucks' parser API is also poorly typed
 */

class SectionExtension {
  sectionData: SectionData
  tags = ['section', 'chunk']

  constructor(sectionData: SectionData) {
    this.sectionData = sectionData
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
        ? getSectionRange(this.sectionData, startName, endName, defaultContent)
        : getSection(this.sectionData, startName, defaultContent)

    return new nunjucks.runtime.SafeString(result)
  }

  runChunk(
    _: any,
    chunkName: string,
    optionalDefaultContent?: () => string,
  ): nunjucks.runtime.SafeString {
    // endName is actually optionalDefaultContent when the section block was only passed a startName
    const defaultContent = optionalDefaultContent?.().trim() || ''
    const result = getChunk(this.sectionData, chunkName, defaultContent)
    return new nunjucks.runtime.SafeString(result)
  }
}

function getChunk(sectionData: SectionData, chunkName: string, defaultContent: string) {
  const section = sectionData.list.find((section) => section.name === chunkName)

  return section?.chunk.trim() || defaultContent
}

function getSection(sectionData: SectionData, startName: string, defaultContent: string) {
  return sectionData.byName[startName] || defaultContent
}

function getSectionRange(
  sectionData: SectionData,
  startName: string,
  endName: string,
  defaultContent: string,
) {
  const sectionList = sectionData.list
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

export { SectionExtension }
