import { App, getFrontMatterInfo, Notice, parseYaml, stringifyYaml, TFile, TFolder } from 'obsidian'

import { createTemplate } from 'src/createTemplate'
import { parseSections } from 'src/parseSections'
import { ensure, EnsureError, fileHasBlueprint, findInTree } from './utils'

async function executeFileBlueprint(app: App, file: TFile) {
  try {
    const metadata = ensure(
      app.metadataCache.getFileCache(file),
      `No cached metadata for ${file.basename}`,
    )
    const propPath = ensure(
      metadata.frontmatterLinks?.find((link) => link.key === 'blueprint'),
      'File has no blueprint',
    )
    const linkPath = ensure(
      app.metadataCache.getFirstLinkpathDest(propPath?.link, file.path),
      'Cannot find linked blueprint',
    )
    const blueprint = await app.vault.cachedRead(linkPath)
    const contents = await app.vault.read(file)
    // TODO: Remove
    const sectionsByHeading = parseSections(metadata, contents)
    const noteFrontmatter = metadata?.frontmatter || {}
    const blueprintFrontmatterInfo = getFrontMatterInfo(blueprint)
    const blueprintFrontmatter =
      parseYaml(blueprintFrontmatterInfo.frontmatter) ?? ({} as Record<string, unknown>)
    const missingFrontmatterEntries = Object.fromEntries(
      Object.entries(blueprintFrontmatter).filter(([key]) => !(key in noteFrontmatter)),
    )
    const frontmatter = Object.assign({}, noteFrontmatter, missingFrontmatterEntries)

    const template = createTemplate({ app, blueprint, filePath: file.path, sectionsByHeading })

    const renderedContent: string = await new Promise((resolve, reject) => {
      const renderContext = { file, frontmatter, ...frontmatter }
      template.render(renderContext, (err: unknown, result: string) => {
        if (err) {
          return reject(err)
        }

        return resolve(result)
      })
    })

    const outputContent = blueprintFrontmatterInfo.exists
      ? renderedContent.slice(blueprintFrontmatterInfo.contentStart)
      : renderedContent

    const outputNote = ['---', stringifyYaml(frontmatter).trim(), '---', outputContent].join('\n')

    await app.vault.modify(file, outputNote)
  } catch (error) {
    if (error instanceof EnsureError) {
      new Notice(error.message)
    } else if (error.name.startsWith('Template render error')) {
      new Notice(`${error.name}\n${error.message}`)
    } else {
      console.error(error)
    }
  }
}

async function executeFolderBlueprints(app: App, root: TFolder) {
  const files = findInTree(root, (leaf: TFile) => fileHasBlueprint(app, leaf))

  if (files.length === 0) {
    new Notice(`No files with Blueprints found in ${root.path}`)
    return
  }

  for (const file of files) {
    await executeFileBlueprint(app, file)
  }

  new Notice(`Applied Blueprints in ${files.length} files`)
}

export { executeFileBlueprint, executeFolderBlueprints }
