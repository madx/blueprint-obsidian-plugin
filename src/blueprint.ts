import { Result } from '@bloodyowl/boxed'
import { getFrontMatterInfo, parseYaml, stringifyYaml } from 'obsidian'
import { Frontmatter, parseFrontmatter } from './frontmatter'
import { ErrorMessage } from './types'
import { TargetFile } from './targetFile'
import { safeMerge } from './utils'
import { Renderer } from './renderer'

export type Blueprint = {
  source: string
  contentSource: string
  frontmatterSource: string
  frontmatter: Frontmatter
  options: BlueprintOptions
}

type BlueprintOptions = {
  folder?: string
}

export function readBlueprint(source: string): Result<Blueprint, ErrorMessage> {
  const frontmatterInfo = getFrontMatterInfo(source)
  const parseFrontmatterResult = parseFrontmatter(frontmatterInfo.frontmatter)

  if (parseFrontmatterResult.isError()) {
    return Result.Error(parseFrontmatterResult.getError())
  }

  const frontmatter = parseFrontmatterResult.get()
  const readOptionsResult = readBlueprintOptions(frontmatter)

  if (readOptionsResult.isError()) {
    return Result.Error(readOptionsResult.getError())
  }

  const options = readOptionsResult.get()

  return Result.Ok({
    source: source,
    contentSource: source.slice(frontmatterInfo.contentStart),
    frontmatterSource: source.slice(frontmatterInfo.from, frontmatterInfo.to).trim(),
    frontmatter,
    options,
  })
}

export async function applyBlueprint(blueprint: Blueprint, target: TargetFile, renderer: Renderer) {
  // Render blueprint's frontmatter then merge it with the note's frontmatter
  const beforeRenderingMergedFrontmatter = safeMerge(target.frontmatter, blueprint.frontmatter)

  const frontmatterContext = {
    file: target.file,
    frontmatter: beforeRenderingMergedFrontmatter,
    ...beforeRenderingMergedFrontmatter,
  }
  const renderedBlueprintFrontmatter = await renderer(
    blueprint.frontmatterSource,
    frontmatterContext,
  )
  const parsedRenderedBlueprintFrontmatter = (parseYaml(renderedBlueprintFrontmatter) ??
    {}) as Record<string, unknown>

  delete parsedRenderedBlueprintFrontmatter.blueprint

  const afterRenderingMergedFrontmatter = safeMerge(
    target.frontmatter,
    parsedRenderedBlueprintFrontmatter,
  )

  const renderedFrontmatter = stringifyYaml(afterRenderingMergedFrontmatter).trim()

  const contentContext = {
    file: target.file,
    frontmatter: afterRenderingMergedFrontmatter,
    ...afterRenderingMergedFrontmatter,
  }
  const renderedContent = await renderer(blueprint.contentSource, contentContext)

  return renderedFrontmatter !== '{}'
    ? ['---', renderedFrontmatter, '---', renderedContent].join('\n')
    : renderedContent
}

function readBlueprintOptions(frontmatter: Frontmatter): Result<BlueprintOptions, ErrorMessage> {
  if (!('blueprint' in frontmatter)) {
    return Result.Ok({})
  }

  if (typeof frontmatter.blueprint !== 'object') {
    return Result.Error(`Invalid blueprint options`)
  }

  const options = frontmatter.blueprint

  if (options && 'folder' in options && typeof options.folder !== 'string') {
    return Result.Error(`Invalid value ${options.folder} for 'folder' option`)
  }

  delete frontmatter.blueprint

  return Result.Ok(options as BlueprintOptions)
}
