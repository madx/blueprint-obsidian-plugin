import { App, MarkdownView, Notice, TFile } from "obsidian";
import * as nunjucks from "nunjucks"

import { SectionExtension } from "./SectionExtension";
import { ObsidianLoader } from "./ObsidianLoader";
import { ensure, EnsureError, findSectionsWithHeadings } from "./utils";

async function executeFileBlueprint(app: App, file: TFile) {
  const obsidianLoader = new ObsidianLoader(app)

  try {
    const metadata = ensure(app.metadataCache.getFileCache(file), `No cached metadata for ${file.basename}`)
    const frontmatterPosition = ensure(metadata.frontmatterPosition, "File has no frontmatter")
    const propPath = ensure(metadata.frontmatterLinks?.find(link => link.key === "blueprint"), "File has no blueprint")
    const linkPath = ensure(app.metadataCache.getFirstLinkpathDest(propPath?.link, file.path), "Cannot find linked blueprint")
    const blueprint = await app.vault.cachedRead(linkPath)
    const contents = await app.vault.read(file)


    const sections = findSectionsWithHeadings(metadata, contents)

    const frontmatter = metadata?.frontmatter || {}
    const getSection = (sectionName: string, defaultContent = "") => sections[sectionName] || defaultContent
    const env = new nunjucks.Environment(obsidianLoader, { autoescape: false })
    env.addExtension("SectionExtension", new SectionExtension(getSection))
    const template = new nunjucks.Template(blueprint, env, file.path)

    try {
      const renderedContent: string = await new Promise((resolve, reject) => {
        const renderContext = { file, frontmatter, ...frontmatter }
        template.render(renderContext, (err: unknown, result: string) => {
          if (err) {
            return reject(err)
          }

          return resolve(result)
        })
      })

      app.vault.process(file, (contents) => {
        const frontmatterRaw = contents.slice(0, (frontmatterPosition?.end.offset || 0) + 1)

        return [frontmatterRaw, renderedContent].join("")
      })
    } catch (error) {
      console.error(error)
    }

  } catch (error) {
    if (error instanceof EnsureError) {
      new Notice(error.message)
    } else {
      console.error(error)
    }
  }

}

export { executeFileBlueprint }
