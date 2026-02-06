function toEmbed(link: string, display?: string) {
  return display ? `!${link.replace(/\]\]$/, `|${display}]]`)}` : `!${link}`
}

export { toEmbed }
