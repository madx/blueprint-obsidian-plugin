import * as nunjucks from 'nunjucks'

import { App } from 'obsidian'
import { ObsidianLoader } from './ObsidianLoader'
import { SectionExtension } from './SectionExtension'

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

  return new nunjucks.Template(blueprint, env, filePath)
}

export { createTemplate }
