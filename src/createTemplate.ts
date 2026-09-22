import * as nunjucks from 'nunjucks'

import { App, moment } from 'obsidian'
import { ObsidianLoader } from './ObsidianLoader'
import { SectionExtension } from './SectionExtension'
import { debug, prefixLines, split, toEmbed } from './filters'
import { SectionData } from './parseSections'

type CreateTemplate = {
  app: App
  blueprint: string
  filePath: string
  sectionData: SectionData
}

function createResolve(app: App) {
  return (filePath: string) => {
    const cleanFilePath = filePath.startsWith('[[') ? filePath.slice(2, -2) : filePath

    const file = app.metadataCache.getFirstLinkpathDest(cleanFilePath, filePath)

    if (!file) {
      throw new Error(`Unable to resolve ${filePath}`)
    }

    const fileCache = app.metadataCache.getFileCache(file)
    const frontmatter = fileCache?.frontmatter ?? {}

    return {
      file,
      frontmatter,
      ...frontmatter,
    }
  }
}

function createTemplate({ app, blueprint, filePath, sectionData }: CreateTemplate) {
  const obsidianLoader = new ObsidianLoader(app)
  const env = new nunjucks.Environment(obsidianLoader, { autoescape: false })
  env.addExtension('SectionExtension', new SectionExtension(sectionData))

  env.addGlobal('moment', moment)
  env.addGlobal('resolve', createResolve(app))

  env.addFilter('prefix_lines', prefixLines)
  env.addFilter('split', split)
  env.addFilter('to_embed', toEmbed)
  env.addFilter('debug', debug)

  return new nunjucks.Template(blueprint, env, filePath)
}

export { createTemplate }
