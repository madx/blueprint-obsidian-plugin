import * as nunjucks from 'nunjucks'

import { App, moment } from 'obsidian'
import { ObsidianLoader } from './ObsidianLoader'
import { SectionExtension } from './SectionExtension'
import { filters } from './filters'
import { SectionData } from './parseSections'
import { isWikiLink, unwikilink } from './utils'
import {
  standardFilters as knapFilters,
  TemplateFilter as KnapTemplateFilter,
  standardFilters,
} from 'knap'

type CreateTemplate = {
  app: App
  blueprint: string
  filePath: string
  sectionData: SectionData
}

function createResolve(app: App) {
  return (filePath: string) => {
    const cleanFilePath = isWikiLink(filePath) ? unwikilink(filePath) : filePath

    const file = app.metadataCache.getFirstLinkpathDest(cleanFilePath, filePath)

    if (!file) {
      return null
    }

    const fileCache = app.metadataCache.getFileCache(file)

    if (!fileCache) {
      return null
    }

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

  for (const [filterName, filterFunc] of Object.entries(filters)) {
    env.addFilter(filterName, filterFunc)
  }

  for (const [filterName, filterFunc] of Object.entries(knapFilters)) {
    env.addFilter(`knap.${filterName}`, wrapKnapFilter(filterFunc))
  }

  return new nunjucks.Template(blueprint, env, filePath)
}

function wrapKnapFilter(filterFunc: KnapTemplateFilter) {
  return (input: any, param?: string) => {
    if (typeof input === 'string') {
      return filterFunc(input, param)
    }
    return filterFunc(JSON.stringify(input), param)
  }
}

export { createTemplate }
