import { assert, describe, expect, test } from 'vitest'
import { Result } from '@bloodyowl/boxed'
import { App, stringifyYaml, TFile } from 'obsidian'
import { stringify } from 'yaml'
import { applyBlueprint, Blueprint, readBlueprint } from '../blueprint'
import { readTargetFile } from '../targetFile'
import { createRenderer, createResolver } from '../renderer'
import { loadBlueprint, loadTargetFile } from './testUtils'

describe('createRenderer', async () => {
  test('returns a nunjucks renderer', async () => {
    const targetFile = await loadTargetFile('empty')
    const resolver = (_: string) => ({ file: targetFile.file as TFile, frontmatter: {} })

    const renderer = createRenderer(resolver, targetFile)

    assert.isFunction(renderer)

    const expected = 'A template'
    const result = await renderer('A template', {})

    assert.equal(expected, result)
  })

  test('fails if nunjucks cannot render', async () => {
    const targetFile = await loadTargetFile('empty')
    const resolver = (_: string) => ({ file: targetFile.file as TFile, frontmatter: {} })

    const renderer = createRenderer(resolver, targetFile)

    await expect(renderer('{{syntax_error', {})).rejects.toThrow()
  })

  test('wraps knap filters', async () => {
    const targetFile = await loadTargetFile('empty')
    const resolver = (_: string) => ({ file: targetFile.file as TFile, frontmatter: {} })

    const renderer = createRenderer(resolver, targetFile)

    const tests = [
      // Handles string arguments
      { template: '{{"string" | knap.bold}}', expected: '**string**' },
      // Handles other arguments
      { template: '{{ [1,2,3] | knap.list}}', expected: '- 1\n- 2\n- 3' },
    ]

    for (const test of tests) {
      const result = await renderer(test.template, {})

      assert.equal(result, test.expected)
    }
  })
})

describe('createResolver', async () => {
  test('returns a resolver for the file', () => {
    const file = { path: 'path' }
    const frontmatter = { key: 'value' }
    const app = {
      metadataCache: {
        getFileCache(_: TFile) {
          return { frontmatter }
        },
        getFirstLinkpathDest(_: string, __: string) {
          return file
        },
      },
    }
    const resolver = createResolver(app as unknown as App)
    assert.isFunction(resolver)

    const result = resolver('file')
    assert.isNotNull(result)
    assert.equal(result.file, file)
    assert.equal(result.frontmatter, frontmatter)
    assert.hasAnyKeys(result, ['key'])
  })

  test('returns null if it cannot resolve the file', () => {
    const app = {
      metadataCache: {
        getFirstLinkpathDest(_: string, __: string) {
          return null
        },
      },
    }
    const resolver = createResolver(app as App)
    const result = resolver('unknown_file')

    assert.isNull(result)
  })

  test('returns null if the resolved file has no metadata cache', () => {
    const app = {
      metadataCache: {
        getFileCache(_: unknown) {
          return null
        },
        getFirstLinkpathDest(_: string, __: string) {
          return { path: 'unknown_file' }
        },
      },
    }
    const resolver = createResolver(app as App)
    const result = resolver('unknown_file')

    assert.isNull(result)
  })

  test('uses an empty frontmatter if the file has no frontmatter', () => {
    const app = {
      metadataCache: {
        getFileCache(_: unknown) {
          return {}
        },
        getFirstLinkpathDest(_: string, __: string) {
          return { path: 'file' }
        },
      },
    }
    const resolver = createResolver(app as App)
    const result = resolver('file')
    assert.isNotNull(result)
    assert.isEmpty(result.frontmatter)
  })

  test('handles wikilinks', () => {
    const app = {
      metadataCache: {
        getFileCache(_: unknown) {
          return null
        },
        getFirstLinkpathDest(path: string, __: string) {
          return path === 'wikilink' ? { path: 'unknown_file' } : null
        },
      },
    }
    const resolver = createResolver(app as App)
    const result = resolver('[[wikilink]]')

    assert.isNull(result)
  })
})
