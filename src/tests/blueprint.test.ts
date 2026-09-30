import { Result } from '@bloodyowl/boxed'
import { stringifyYaml, TFile } from 'obsidian'
import { stringify } from 'yaml'
import { assert, describe, test } from 'vitest'
import { applyBlueprint, Blueprint, readBlueprint } from '../blueprint'
import { readTargetFile } from '../targetFile'
import { createRenderer } from '../renderer'
import { loadBlueprint, loadTargetFile } from './testUtils'

function buildExpected(overrides?: Partial<Blueprint>): Result<Blueprint, unknown> {
  return Result.Ok({
    source: '',
    contentSource: '',
    frontmatterSource: '',
    frontmatter: {},
    options: {},
    ...overrides,
  })
}

function buildFrontmatter(object: unknown): string {
  const frontmatter = stringify(object)
  return `---\n${frontmatter}\n---`
}

describe('readBlueprint', async () => {
  test('reads a blueprint file into the corresponding data structure', () => {
    const source = 'Hello, world!'
    const expected = buildExpected({
      source,
      contentSource: source,
    })
    const result = readBlueprint(source)

    assert.deepEqual(result, expected)
  })

  test('extracts blueprint options from the frontmatter', () => {
    const options = {
      folder: 'folder',
    }
    const source = buildFrontmatter({
      blueprint: options,
    })
    const expected = buildExpected({
      source,
      contentSource: '',
      frontmatterSource: stringify({ blueprint: options }).trim(),
      frontmatter: {},
      options,
    })
    const result = readBlueprint(source)

    assert.deepEqual(result, expected)
  })

  test('returns an error if it fails to parse the blueprint frontmatter', () => {
    const source = buildFrontmatter('fail')
    const expected = Result.Error('Invalid frontmatter')
    const result = readBlueprint(source)

    assert.deepEqual(result, expected)
  })

  test('fails if blueprint options are not an object', () => {
    const source = buildFrontmatter({
      blueprint: 'fail',
    })
    const expected = Result.Error('Invalid blueprint options')
    const result = readBlueprint(source)

    assert.deepEqual(result, expected)
  })

  test('blueprint.folder must be a string', () => {
    const source = buildFrontmatter({
      blueprint: {
        folder: 1,
      },
    })
    const expected = Result.Error("Invalid value 1 for 'folder' option")
    const result = readBlueprint(source)

    assert.deepEqual(result, expected)
  })
})

describe('applyBlueprint', () => {
  const defaultBlueprintHeader = '---\nblueprint: "[[Blueprint.blueprint]]"\n---\n'
  test('applies a blueprint to a target file', async () => {
    const helloWorld = await loadBlueprint('hello_world')
    const emptyFile = await loadTargetFile('empty')
    const resolver = (_: string) => ({ file: emptyFile.file as TFile, frontmatter: {} })
    const renderer = createRenderer(resolver, emptyFile)

    const expected = 'Hello, world.\n'
    const result = await applyBlueprint(helloWorld, emptyFile, renderer)

    assert.equal(result, expected)
  })

  test('handles section tags with updates', async () => {
    const blueprint = await loadBlueprint('h1_section')
    const initialFile = await loadTargetFile('h1_section__initial')
    const updateFile = await loadTargetFile('h1_section__update')
    const resolver = (_: string) => ({ file: initialFile.file as TFile, frontmatter: {} })

    const initialRenderer = createRenderer(resolver, initialFile)
    const initialExpected = `${defaultBlueprintHeader}# H1\nDefault text\n`
    const initialResult = await applyBlueprint(blueprint, initialFile, initialRenderer)

    assert.equal(initialResult, initialExpected)

    const updateRenderer = createRenderer(resolver, updateFile)
    const updateExpected = `${defaultBlueprintHeader}# H1\nUpdated text\n`
    const updateResult = await applyBlueprint(blueprint, updateFile, updateRenderer)

    assert.equal(updateResult, updateExpected)
  })
})
