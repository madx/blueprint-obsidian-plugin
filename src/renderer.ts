import * as nunjucks from 'nunjucks'

import { App, FrontMatterCache, moment, TFile } from 'obsidian'
import { ObsidianLoader } from './ObsidianLoader'
import { SectionExtension } from './SectionExtension'
import { filters } from './filters'
import { isWikiLink, unwikilink } from './utils'
import { standardFilters as knapFilters, TemplateFilter as KnapTemplateFilter } from 'knap'
import { TargetFile } from './targetFile'

export type Renderer = (source: string, context: Record<string, unknown>) => Promise<string>

export function createRenderer(resolver: Resolver, targetFile: TargetFile): Renderer {
  const obsidianLoader = new ObsidianLoader()
  const env = new nunjucks.Environment(obsidianLoader, { autoescape: false })
  env.addExtension('SectionExtension', new SectionExtension(targetFile))

  env.addGlobal('moment', moment)
  env.addGlobal('resolve', resolver)

  for (const [filterName, filterFunc] of Object.entries(filters)) {
    env.addFilter(filterName, filterFunc)
  }

  for (const [filterName, filterFunc] of Object.entries(knapFilters)) {
    env.addFilter(`knap.${filterName}`, wrapKnapFilter(filterFunc))
  }

  return (source: string, context: Record<string, unknown>) => {
    const template = new nunjucks.Template(source, env, targetFile.file.path)

    return new Promise<string>((resolve, reject) => {
      template.render(context, (err: unknown, result: string | null) => {
        if (err) {
          return reject(err)
        }

        /* Ignore the next line from coverage because we can't really tell when
         * render passes null as a result
         */
        /* v8 ignore next -- @preserve */
        return resolve(result ?? '')
      })
    })
  }
}

type Resolver = (filePath: string) => { file: TFile; frontmatter: FrontMatterCache } | null

export function createResolver(app: App): Resolver {
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

function wrapKnapFilter(filterFunc: KnapTemplateFilter) {
  return (input: any, param?: string) => {
    if (typeof input === 'string') {
      return filterFunc(input, param)
    }
    return filterFunc(JSON.stringify(input), param)
  }
}
