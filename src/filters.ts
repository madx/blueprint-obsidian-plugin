import { link } from 'node:fs'
import { isWikiLink, unwikilink } from './utils'

function debug(value: unknown) {
  console.log(value)
  return JSON.stringify(value, null, 2)
}

function prefixLines(string: string, prefix: string) {
  return string
    .split(/\n/)
    .map((line) => `${prefix}${line}`)
    .join('\n')
}

function split(string: string, separator: string) {
  return string.split(separator)
}

function embed(linkable: string, display?: string) {
  if (linkable.trim().length === 0) {
    return ''
  }

  if (isWikiLink(linkable)) {
    const path = unwikilink(linkable)

    return '!' + wikilink(path, display)
  } else {
    return `![${display ?? ''}](${linkable})`
  }
}

function wikilink(linkable: string, alias?: string) {
  const path = isWikiLink(linkable) ? unwikilink(linkable) : linkable

  return alias ? `[[${path}|${alias}]]` : `[[${path}]]`
}

function heading_link(linkable: string, heading: string, alias?: string) {
  return wikilink(`${unwikilink(linkable)}#${heading}`, alias)
}

export const filters = { debug, embed, heading_link, prefixLines, split, wikilink, unwikilink }
