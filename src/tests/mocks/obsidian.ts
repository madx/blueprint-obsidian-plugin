import { parse, stringify } from 'yaml'
/**
 * getFrontMatterInfo mock
 *
 * This is a retro-engineered version of getFrontMatterInfo from Obsidian
 */
interface FrontMatterInfo {
  exists: boolean
  contentStart: number
  from: number
  to: number
  frontmatter: string
}

const FRONTMATTER_START = /^---(\r?\n)/g
const FRONTMATTER_END = /---(\r?\n|$)/g

export function getFrontMatterInfo(text: string): FrontMatterInfo {
  FRONTMATTER_START.lastIndex = 0

  if (!FRONTMATTER_START.exec(text)) {
    return { exists: false, contentStart: 0, from: 0, to: 0, frontmatter: '' }
  }

  const startOfFrontmatter = FRONTMATTER_START.lastIndex

  FRONTMATTER_END.lastIndex = startOfFrontmatter
  let endMatch = FRONTMATTER_END.exec(text)

  while (endMatch && text.charAt(endMatch.index - 1) !== '\n') {
    endMatch = FRONTMATTER_END.exec(text)
  }

  if (!endMatch) {
    return { exists: false, contentStart: 0, from: 0, to: 0, frontmatter: '' }
  }

  const endOfFrontmatter = endMatch.index
  const startOfContent = FRONTMATTER_END.lastIndex

  return {
    exists: true,
    frontmatter: text.slice(startOfFrontmatter, endOfFrontmatter),
    from: startOfFrontmatter,
    to: endOfFrontmatter,
    contentStart: startOfContent,
  }
}

/**
 * parseYaml
 */

export function parseYaml(yaml: string): any {
  return parse(yaml)
}

/**
 * stringifyYaml
 */

export function stringifyYaml(yaml: string): any {
  return stringify(yaml)
}
