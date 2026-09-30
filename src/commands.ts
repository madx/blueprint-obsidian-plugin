import { App, Notice, Platform, TFile, TFolder } from 'obsidian'

import { BlueprintSuggestModal } from './BlueprintSuggestModal'
import { ensure, EnsureError, fileHasBlueprint, findInTree, joinPath } from './utils'
import { applyBlueprint, readBlueprint } from './blueprint'
import { readTargetFile } from './targetFile'
import { createRenderer, createResolver } from './renderer'

async function newFile(app: App, path: string, content: string = '') {
  const createdFile = await app.vault.create(path, content)

  const mostRecentLeaf = app.workspace.getMostRecentLeaf()

  if (mostRecentLeaf) {
    await mostRecentLeaf.openFile(createdFile)
    await app.workspace.revealLeaf(mostRecentLeaf)
    if (Platform.isMobile) {
      app.workspace.leftSplit.collapse()
    }
    mostRecentLeaf.setEphemeralState({ rename: 'all' })
  }
}

async function createBlueprint(app: App) {
  const currentFilePath = app.workspace.getActiveFile()?.path ?? ''
  const defaultFolder = app.fileManager.getNewFileParent(currentFilePath)

  await createBlueprintInFolder(app, defaultFolder.path)
}

async function createBlueprintInFolder(app: App, folderPath: string) {
  let blueprintName = 'Untitled Blueprint.blueprint'
  let counter = 1

  while (await app.vault.adapter.exists(joinPath(folderPath, blueprintName))) {
    blueprintName = `Untitled Blueprint ${counter}.blueprint`
    counter++
  }

  await newFile(app, joinPath(folderPath, blueprintName))
}

async function createNoteFromBlueprint(app: App) {
  const currentFilePath = app.workspace.getActiveFile()?.path ?? ''
  const defaultFolder = app.fileManager.getNewFileParent(currentFilePath)

  await createNoteFromBlueprintInFolder(app, defaultFolder.path)
}

async function createNoteFromBlueprintInFolder(app: App, folderPath: string) {
  const blueprint = await BlueprintSuggestModal.prompt(app)

  if (!blueprint) {
    return
  }

  let noteName = 'Untitled.md'
  let counter = 1

  while (await app.vault.adapter.exists(joinPath(folderPath, noteName))) {
    noteName = `Untitled ${counter}.md`
    counter++
  }

  const blueprintLink = app.fileManager.generateMarkdownLink(blueprint, folderPath)
  const content = ['---', `blueprint: "${blueprintLink}"`, '---'].join('\n')

  await newFile(app, joinPath(folderPath, noteName), content)
}

async function executeFileBlueprint(app: App, file: TFile, shouldNotify?: boolean) {
  try {
    const targetFileMetadata = ensure(
      app.metadataCache.getFileCache(file),
      `No cached metadata for ${file.basename}`,
    )
    const blueprintPropertyPath = ensure(
      targetFileMetadata.frontmatterLinks?.find((link) => link.key === 'blueprint'),
      'File has no blueprint',
    )
    const blueprintFile = ensure(
      app.metadataCache.getFirstLinkpathDest(blueprintPropertyPath?.link, file.path),
      'Cannot find linked blueprint',
    )

    const blueprintSource = await app.vault.cachedRead(blueprintFile)
    const targetFileSource = await app.vault.read(file)
    const targetFileResult = readTargetFile(file, targetFileSource, targetFileMetadata)
    const blueprintResult = readBlueprint(blueprintSource)

    if (targetFileResult.isError()) {
      throw targetFileResult.getError()
    }

    if (blueprintResult.isError()) {
      throw blueprintResult.getError()
    }

    const blueprint = blueprintResult.get()
    const targetFile = targetFileResult.get()
    const resolver = createResolver(app)
    const renderer = createRenderer(resolver, targetFile)

    const output = await applyBlueprint(blueprint, targetFile, renderer)

    await app.vault.process(file, () => output)

    if (blueprint.options.folder) {
      await app.vault.rename(file, `${blueprint.options.folder}/${file.name}`)
    }

    if (shouldNotify) {
      new Notice('Applied blueprint')
    }
  } catch (error) {
    if (error instanceof EnsureError) {
      new Notice(error.message)
    } else if (error instanceof Error) {
      new Notice(`${error.name}\n${error.message}`)
    }
    console.error(error)
  }
}

async function executeFolderBlueprint(app: App, root: TFolder) {
  const blueprint = await BlueprintSuggestModal.prompt(app)

  if (!blueprint) {
    return
  }

  const files = findInTree(root, (leaf: TFile) => fileHasBlueprint(app, leaf, blueprint))

  if (files.length === 0) {
    new Notice(`No notes with blueprint ${blueprint.path} found in ${root.path}`)
    return
  }

  for (const file of files) {
    await executeFileBlueprint(app, file)
  }

  new Notice(`Applied blueprint ${blueprint.path} in ${files.length} notes`)
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

export {
  createBlueprint,
  createBlueprintInFolder,
  createNoteFromBlueprint,
  createNoteFromBlueprintInFolder,
  executeFileBlueprint,
  executeFolderBlueprint,
  executeFolderBlueprints,
  updateBlueprintNotes,
}
