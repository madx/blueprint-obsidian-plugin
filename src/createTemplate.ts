import * as nunjucks from 'nunjucks'

import { App, moment } from 'obsidian'
import { ObsidianLoader } from './ObsidianLoader'
import { SectionExtension } from './SectionExtension'
import { toEmbed } from './filters'

type CreateTemplate = {
  app: App
  blueprint: string
  filePath: string
  sectionsByHeading: Record<string, string>
}

function createTemplate({ app, blueprint, filePath, sectionsByHeading }: CreateTemplate) {
  const obsidianLoader = new ObsidianLoader(app)
  const env = new nunjucks.Environment(obsidianLoader, { autoescape: false, trimBlocks: true })
  const getSection = (sectionName: string, defaultContent = '') =>
    sectionsByHeading[sectionName] || defaultContent
  env.addExtension('SectionExtension', new SectionExtension(getSection))

  env.addGlobal('moment', moment)

  env.addFilter('to_embed', toEmbed)

  env.addFilter('split', (string: string, separator: string) => {
    return string.split(separator)
  })

  return new nunjucks.Template(blueprint, env, filePath)
}

export { createTemplate }
