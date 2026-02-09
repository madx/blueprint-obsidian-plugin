import * as nunjucks from 'nunjucks'

import { App, moment } from 'obsidian'
import { ObsidianLoader } from './ObsidianLoader'
import { SectionExtension } from './SectionExtension'
import { prefixLines, split, toEmbed } from './filters'

type CreateTemplate = {
  app: App
  blueprint: string
  filePath: string
  sectionsByHeading: Record<string, string>
}

function createGetFrontmatter(app: App, filePath: string) {
  return (targetPath: string) => {
    const cleanTargetPath = targetPath.startsWith('[[')
      ? targetPath.slice(2, targetPath.length - 2)
      : targetPath

    const target = app.metadataCache.getFirstLinkpathDest(cleanTargetPath, filePath)

    if (!target) {
      throw `Unable to resolve ${targetPath}`
    }

    return app.metadataCache.getFileCache(target)?.frontmatter ?? {}
  }
}

function createTemplate({ app, blueprint, filePath, sectionsByHeading }: CreateTemplate) {
  const obsidianLoader = new ObsidianLoader(app)
  const env = new nunjucks.Environment(obsidianLoader, { autoescape: false, trimBlocks: true })
  const getSection = (sectionName: string, defaultContent = '') =>
    sectionsByHeading[sectionName] || defaultContent
  env.addExtension('SectionExtension', new SectionExtension(getSection))

  env.addGlobal('moment', moment)
  env.addGlobal('get_frontmatter', createGetFrontmatter(app, filePath))

  env.addFilter('prefix_lines', prefixLines)
  env.addFilter('split', split)
  env.addFilter('to_embed', toEmbed)

  return new nunjucks.Template(blueprint, env, filePath)
}

export { createTemplate }
