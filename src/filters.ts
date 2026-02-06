const TO_EMBED_URL_REGEX = /^https?:\/\//

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

export { split, toEmbed }
