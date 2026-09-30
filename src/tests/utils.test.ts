import { App, TAbstractFile, TFile, TFolder } from 'obsidian'
import { assert, describe, test } from 'vitest'
import {
  ensure,
  fileHasBlueprint,
  fileIsBlueprint,
  findInTree,
  isWikiLink,
  joinPath,
  safeMerge,
  unwikilink,
} from '../utils'

function fakeFile(fields?: Partial<TFile>): TFile {
  return { ...fields } as TFile
}

function fakeFolder(children: TAbstractFile[]): TFolder {
  return { children } as unknown as TFolder
}

describe('ensure', () => {
  test('returns the value untouched if truthy', () => {
    const result = ensure('value', 'message')

    assert.equal(result, 'value')
  })

  test('throws the message as EnsureError otherwise', () => {
    assert.throws(() => {
      ensure(null, 'message')
    }, 'message')

    assert.throws(() => {
      ensure(0, 'message')
    }, 'message')

    assert.throws(() => {
      ensure('', 'message')
    }, 'message')
  })
})

describe('fileIsBlueprint', () => {
  test('returns true if the file extension is .blueprint', () => {
    const file = fakeFile({ extension: 'blueprint' })
    assert.isTrue(fileIsBlueprint(file))
  })

  test('returns false otherwise', () => {
    const file = fakeFile({ extension: 'json' })
    assert.isFalse(fileIsBlueprint(file))
  })
})

describe('fileHasBlueprint', () => {
  test('returns true if the file has a blueprint string property', () => {
    const app = {
      metadataCache: {
        getFileCache(_: TFile) {
          return { frontmatterLinks: [{ key: 'blueprint' }] }
        },
      },
    }

    assert.isTrue(fileHasBlueprint(app as App, fakeFile()))
  })

  test('returns false otherwise', () => {
    const app = {
      metadataCache: {
        getFileCache(_: TFile) {
          return {}
        },
      },
    }

    assert.isFalse(fileHasBlueprint(app as App, fakeFile()))
  })

  test('returns true if the file uses a given blueprint', () => {
    const blueprintPath = 'path/to/blueprint.blueprint'
    const app = {
      metadataCache: {
        getFileCache(_: TFile) {
          return { frontmatterLinks: [{ key: 'blueprint' }] }
        },
        getFirstLinkpathDest(_: string, __: string) {
          return { path: blueprintPath }
        },
      },
    }

    assert.isTrue(fileHasBlueprint(app as App, fakeFile(), fakeFile({ path: blueprintPath })))
  })

  test('returns false if the file does not use a given blueprint', () => {
    const blueprintPath = 'path/to/blueprint.blueprint'
    const app = {
      metadataCache: {
        getFileCache(_: TFile) {
          return { frontmatterLinks: [{ key: 'blueprint' }] }
        },
        getFirstLinkpathDest(_: string, __: string) {
          return { path: 'path/to/another/blueprint.blueprint' }
        },
      },
    }

    assert.isFalse(fileHasBlueprint(app as App, fakeFile(), fakeFile({ path: blueprintPath })))
  })
})

describe('findInTree', () => {
  test('finds all files matching a predicate in a tree', () => {
    const fileA = fakeFile({ name: 'a' })
    const fileB = fakeFile({ name: 'b' })
    const result = findInTree(fakeFolder([fileA, fileB]), ({ name }) => name === 'a')

    assert.equal(result.length, 1)
    assert.equal(result[0], fileA)
  })

  test('recurses in subdirectories', () => {
    const fileA = fakeFile({ name: 'a' })
    const fileB = fakeFile({ name: 'b' })
    const result = findInTree(fakeFolder([fileA, fakeFolder([fileB])]), ({ name }) => name === 'b')

    assert.equal(result.length, 1)
    assert.equal(result[0], fileB)
  })

  test('returns an empty array if the tree is empty', () => {
    const result = findInTree(fakeFolder([]), () => true)

    assert.isEmpty(result)
  })
})

describe('isWikiLink', () => {
  test('returns true if the string is a wikilink', () => {
    assert.isTrue(isWikiLink('[[Note]]'))
  })

  test('returns false if the string is not a wikilink', () => {
    assert.isFalse(isWikiLink('Note'))
    assert.isFalse(isWikiLink('[[]]'))
  })
})

describe('joinPath', () => {
  test('joins a folder path and a file path with a /', () => {
    assert.equal('a/b', joinPath('a', 'b'))
  })

  test('keeps a single slash if folder ends with a /', () => {
    assert.equal('a/b', joinPath('a/', 'b'))
  })
})

describe('safeMerge', () => {
  test('merge two disjoint objects', () => {
    assert.deepEqual({ a: 1, b: 2 }, safeMerge({ a: 1 }, { b: 2 }))
  })

  test('keeps values from left if they are defined in right', () => {
    assert.deepEqual({ a: 1 }, safeMerge({ a: 1 }, { a: 2 }))
  })

  test('merges arrays non destructively', () => {
    assert.deepEqual({ a: [1, 2] }, safeMerge({ a: [1] }, { a: [2] }))
  })

  test('merges objects non destructively', () => {
    assert.deepEqual({ a: { b: 1, c: 1 } }, safeMerge({ a: { b: 1 } }, { a: { c: 1 } }))
  })
})

describe('unwikilink', () => {
  test('removes wikilink syntax from a wikilink', () => {
    const expected = 'Note'
    const result = unwikilink('[[Note]]')

    assert.equal(result, expected)
  })

  test('ignores empty wikilinks', () => {
    const expected = '[[]]'
    const result = unwikilink('[[]]')

    assert.equal(result, expected)
  })

  test('returns the string as is if it is not a wikilink', () => {
    const expected = 'Hello'
    const result = unwikilink('Hello')

    assert.equal(result, expected)
  })
})
