import { App, getFrontMatterInfo, Notice, parseYaml, stringifyYaml, TFile, TFolder } from 'obsidian'

import { createTemplate } from 'src/createTemplate'
import { parseSections } from 'src/parseSections'
import { ensure, EnsureError, fileHasBlueprint, findInTree, renderTemplate } from './utils'

async function executeFileBlueprint(app: App, file: TFile) {
  try {
    const metadata = ensure(
      app.metadataCache.getFileCache(file),
      `No cached metadata for ${file.basename}`,
    )
    const blueprintPropertyPath = ensure(
      metadata.frontmatterLinks?.find((link) => link.key === 'blueprint'),
      'File has no blueprint',
    )
    const blueprintFilePath = ensure(
      app.metadataCache.getFirstLinkpathDest(blueprintPropertyPath?.link, file.path),
      'Cannot find linked blueprint',
    )

    const blueprint = await app.vault.cachedRead(blueprintFilePath)
    const fileContent = await app.vault.read(file)
    const filePath = file.path
    const sectionsByHeading = parseSections(metadata, fileContent)

    // Render blueprint's frontmatter then merge it with the note's frontmatter
    const blueprintFrontmatterInfo = getFrontMatterInfo(blueprint)
    const noteFrontmatter = metadata?.frontmatter || {}
    const blueprintFrontmatter =
      parseYaml(blueprintFrontmatterInfo.frontmatter) ?? ({} as Record<string, unknown>)
    const missingFrontmatterEntriesBeforeRendering = Object.fromEntries(
      Object.entries(blueprintFrontmatter).filter(([key]) => !(key in noteFrontmatter)),
    )
    const mergedFrontmatter = Object.assign(
      {},
      noteFrontmatter,
      missingFrontmatterEntriesBeforeRendering,
    )

    const frontmatterTemplate = createTemplate({
      app,
      filePath,
      sectionsByHeading,
      blueprint: blueprint.slice(blueprintFrontmatterInfo.from, blueprintFrontmatterInfo.to),
    })
    const frontmatterContext = { file, frontmatter: mergedFrontmatter, ...mergedFrontmatter }
    const renderedBlueprintFrontmatter = await renderTemplate(
      frontmatterTemplate,
      frontmatterContext,
    )
    const parsedRenderedBlueprintFrontmatter =
      parseYaml(renderedBlueprintFrontmatter) ?? ({} as Record<string, unknown>)
    const missingFrontmatterEntriesAfterRendering = Object.fromEntries(
      Object.entries(parsedRenderedBlueprintFrontmatter).filter(
        ([key]) => !(key in noteFrontmatter),
      ),
    )
    const frontmatter = Object.assign({}, noteFrontmatter, missingFrontmatterEntriesAfterRendering)
    const renderedFrontmatter = stringifyYaml(frontmatter).trim()

    // Render the note's content
    const contentTemplate = createTemplate({
      app,
      filePath,
      sectionsByHeading,
      blueprint: blueprint.slice(blueprintFrontmatterInfo.contentStart),
    })
    const contentContext = { file, frontmatter, ...frontmatter }
    const renderedContent = await renderTemplate(contentTemplate, contentContext)

    // Update note
    const output = ['---', renderedFrontmatter, '---', renderedContent].join('\n')
    await app.vault.process(file, () => output)
  } catch (error) {
    if (error instanceof EnsureError) {
      new Notice(error.message)
    } else if (error.name.startsWith('Template render error')) {
      new Notice(`${error.name}\n${error.message}`)
    }
    console.error(error)
  }
}

async function executeFolderBlueprints(app: App, root: TFolder) {
  const files = findInTree(root, (leaf: TFile) => fileHasBlueprint(app, leaf))

  if (files.length === 0) {
    new Notice(`No notes with blueprints found in ${root.path}`)
    return
  }

  for (const file of files) {
    await executeFileBlueprint(app, file)
  }

  new Notice(`Applied blueprints in ${files.length} notes`)
}

async function updateBlueprintNotes(app: App, file: TFile) {
  const notesUsingBlueprint = Object.entries(app.metadataCache.resolvedLinks)
    .filter(([_, links]) => file.path in links)
    .map(([key]) => key)

  if (notesUsingBlueprint.length === 0) {
    new Notice(`No notes are using this blueprint`)
    return
  }

  for (const notePath of notesUsingBlueprint) {
    const file = app.vault.getFileByPath(notePath)

    if (file) {
      await executeFileBlueprint(app, file)
    }
  }

  new Notice(`Applied blueprint in ${notesUsingBlueprint.length} notes`)
}

export { executeFileBlueprint, executeFolderBlueprints, updateBlueprintNotes }
