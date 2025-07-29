import {
  Plugin,
  setIcon,
  MarkdownView,
} from "obsidian";
import * as nunjucks from "nunjucks"
import { ObsidianLoader } from "./ObsidianLoader";
import { SectionExtension } from "./SectionExtension";
import { findSectionsWithHeadings } from "./utils";


export default class BlueprintPlugin extends Plugin {
  async onload() {
    nunjucks.configure({ autoescape: false, trimBlocks: true })
    const obsidianLoader = new ObsidianLoader(this.app)

    this.addCommand({
      id: "execute-current-file-blueprint",
      name: "Execute current file's blueprint",
      callback: async () => {
        const view = this.app.workspace.getActiveViewOfType(MarkdownView);

        if (!view) {
          return
        }

        const { file, data: contents } = view

        if (!file) {
          return
        }

        const metadata = this.app.metadataCache.getFileCache(file)

        if (!metadata || !metadata.frontmatterPosition) {
          return
        }

        const propPath = metadata.frontmatterLinks?.find(link => link.key === "blueprint")

        if (!propPath) {
          return
        }

        const linkPath = this.app.metadataCache.getFirstLinkpathDest(propPath?.link, file.path)

        if (!linkPath) {
          return
        }

        const blueprint = await this.app.vault.cachedRead(linkPath)
        const sections = findSectionsWithHeadings(metadata, contents)

        if (!blueprint) {
          return
        }

        const frontmatter = metadata?.frontmatter || {}
        const getSection = (sectionName: string, defaultContent = "") => sections[sectionName] || defaultContent
        const env = new nunjucks.Environment(obsidianLoader, { autoescape: false })
        env.addExtension("SectionExtension", new SectionExtension(getSection))
        const template = new nunjucks.Template(blueprint, env, file.path)

        try {
          const renderedContent: string = await new Promise((resolve, reject) => {
            const renderContext = { file, frontmatter, ...frontmatter, section: getSection }
            template.render(renderContext, (err: unknown, result: string) => {
              if (err) {
                return reject(err)
              }

              return resolve(result)
            })
          })

          this.app.vault.process(file, (contents) => {
            const frontmatterRaw = contents.slice(0, (metadata.frontmatterPosition?.end.offset || 0) + 1)

            return [frontmatterRaw, renderedContent].join("")
          })
        } catch (error) {
          console.error(error)
        }
      }
    })
  }
}
