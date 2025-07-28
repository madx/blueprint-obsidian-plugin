import {
  Plugin,
  App,
  setIcon,
  MarkdownView,
  CachedMetadata,
} from "obsidian";
import * as nunjucks from "nunjucks"

class ObsidianLoader extends nunjucks.Loader {
  app: App
  async: true

  constructor(app: App) {
    super()
    this.async = true
    this.app = app
  }

  getSource(path: string, callback: nunjucks.Callback<Error, nunjucks.LoaderSource>) {
    const file = this.app.vault.getFileByPath(path)

    if (!file) {
      if (!path.endsWith('.njk')) {
        this.getSource(`${path}.njk`, callback)
        return
      }
      const error = new Error("No such template")
      callback(error, null)
      return
    }

    this.app.vault.cachedRead(file)
      .then((data) => {
        callback(null, {
          src: data,
          path,
          noCache: true
        })
      })
      .catch((err) => callback(err, null))
  }
}

class SectionExtension {
  getSection: (heading: string, defaultContent?: string) => string
  tags = ['section']

  constructor(getSection: (heading: string, defaultContent?: string) => string) {
    this.getSection = getSection
  }

  // nunjucks' parser API is undocumented so we don't get type info here
  parse(parser: any, nodes: any) {
    const tok = parser.nextToken();

    const args = parser.parseSignature(null, true);
    parser.advanceAfterBlockEnd(tok.value);

    const body = parser.parseUntilBlocks('endsection');

    parser.advanceAfterBlockEnd();

    return new nodes.CallExtension(this, 'run', args, [body]);
  }

  run(_: any, heading: string, defaultContent: () => string) {
    return new nunjucks.runtime.SafeString(this.getSection(heading, defaultContent().trim()))
  }
}

function findSectionsWithHeadings(metadata: CachedMetadata, contents: string) {
  const sectionsWithHeadings: Array<{ heading: string, contents: string }> = []

  for (const section of (metadata.sections || [])) {
    if (section.type !== "heading" && sectionsWithHeadings.length === 0) {
      continue
    }
    if (section.type === "heading") {
      const heading = contents.slice(section.position.start.offset, section.position.end.offset).replace(/^#+\s+/, "")
      sectionsWithHeadings.push({ heading, contents: "" })
      continue
    }
    const lastSection = sectionsWithHeadings.at(-1)!
    const sectionContents = contents.slice(section.position.start.offset, section.position.end.offset)
    lastSection.contents += `${lastSection.contents.length > 0 ? "\n\n" : ''}${sectionContents}`

  }

  return Object.fromEntries(sectionsWithHeadings.map((section) => [section.heading, section.contents]))
}

export default class BlueprintPlugin extends Plugin {
  async onload() {
    nunjucks.configure({ autoescape: false, trimBlocks: true })
    const obsidianLoader = new ObsidianLoader(this.app)

    this.addCommand({
      id: "execute-current-file-blueprint",
      name: "Execute blueprint in current file",
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

    this.registerMarkdownCodeBlockProcessor('blueprint', (_, el) => {
      const codeBlock = el.createEl('div', { cls: "blueprint-code-block" })
      setIcon(codeBlock, 'layout-template')
      codeBlock.createEl('span', { text: "Blueprint" })
    })
  }
}
