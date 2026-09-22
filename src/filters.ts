const TO_EMBED_URL_REGEX = /^https?:\/\//

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

function toEmbed(link: string, display?: string) {
  if (link.length === 0) {
    return link
  }

  return TO_EMBED_URL_REGEX.test(link)
    ? `![${display ?? ''}](${link})`
    : display
      ? `!${link.replace(/\]\]$/, `|${display}]]`)}`
      : `!${link}`
}

export { debug, prefixLines, split, toEmbed }
