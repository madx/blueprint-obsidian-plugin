import { isWikiLink, unwikilink } from './utils'

function debug(value: unknown) {
  console.log(value)
  return JSON.stringify(value, null, 2)
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
function prefixLines(string: string, prefix: string) {
  return string
    .split(/\n/)
    .map((line) => `${prefix}${line}`)
    .join('\n')
}

function split(string: string, separator: string) {
  return string.split(separator)
}

function wikilink(linkable: string, alias?: string) {
  const path = isWikiLink(linkable) ? unwikilink(linkable) : linkable

  return alias ? `[[${path}|${alias}]]` : `[[${path}]]`
}

function heading_link(linkable: string, heading: string, newAlias?: string) {
  return wikilink(`${unwikilink(linkable)}#${heading}`, newAlias)
}

export const filters = { debug, embed, heading_link, prefixLines, split, wikilink, unwikilink }
