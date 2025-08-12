import { App, Notice, TFile, TFolder } from 'obsidian'

import { createTemplate } from 'src/createTemplate'
import { ensure, EnsureError, fileHasBlueprint, findInTree, groupSectionsByHeading } from './utils'

async function executeFileBlueprint(app: App, file: TFile) {
  try {
    const metadata = ensure(
      app.metadataCache.getFileCache(file),
      `No cached metadata for ${file.basename}`,
    )
    const frontmatterPosition = ensure(metadata.frontmatterPosition, 'File has no frontmatter')
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
    const sectionsByHeading = groupSectionsByHeading(metadata, contents)
    const frontmatter = metadata?.frontmatter || {}
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

    app.vault.process(file, (contents) => {
      const frontmatterRaw = contents.slice(0, (frontmatterPosition?.end.offset || 0) + 1)

      return [frontmatterRaw, renderedContent].join('')
    })
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
