import { assert, describe, test, vi } from 'vitest'
import { filters } from '../filters'

const { debug, embed, prefixLines, split, heading_link, wikilink } = filters

describe('debug', async () => {
  test('outputs the provided value to the console', () => {
    using spy = vi.spyOn(console, 'log').mockImplementation(() => {})
    const value = 'value'

    debug(value)

    assert.equal(spy.mock.calls.length, 1)
    assert.deepEqual(spy.mock.calls[0], [value])
  })

  test('returns a JSON reprensentation of the input value', () => {
    const value = 'value'
    const expected = '"value"'
    const result = debug(value)

    assert.equal(result, expected)
  })
})

describe('embed', async () => {
  test('returns an empty string when link is empty', () => {
    assert.isEmpty(embed(''))
  })

  test('returns an embed for WikiLinks', () => {
    const expected = '![[link]]'
    assert.equal(embed('[[link]]'), expected)
  })

  test('returns an embed with display text for WikiLinks', () => {
    const expected = '![[link|display]]'
    assert.equal(embed('[[link]]', 'display'), expected)
  })

  test('returns an embed for URLs', () => {
    const expected = '![](https://example.com)'
    assert.equal(embed('https://example.com'), expected)
  })

  test('returns an embed with display text for URLs', () => {
    const expected = '![](https://example.com)'
    assert.equal(embed('https://example.com'), expected)
  })
})

describe('prefixLines', async () => {
  test('adds the prefix to an empty string', () => {
    const expected = 'PREFIX'
    assert.equal(prefixLines('', 'PREFIX'), expected)
  })

  test('adds the prefix to a single-line string', () => {
    const expected = 'PREFIX TEXT'
    assert.equal(prefixLines('TEXT', 'PREFIX '), expected)
  })

  test('adds the prefix to a single-line string', () => {
    const expected = 'PREFIX LINE 1\nPREFIX LINE 2'
    assert.equal(prefixLines('LINE 1\nLINE 2', 'PREFIX '), expected)
  })
})

describe('split', async () => {
  test('splits a string with a given separator', () => {
    const expected = ['a', 'b']
    const result = split('a,b', ',')

    assert.deepEqual(result, expected)
  })
})

describe('wikilink', async () => {
  test('is idempotent on a basic wikilink', () => {
    const linkable = '[[Note]]'
    const expected = '[[Note]]'
    const result = wikilink(linkable)

    assert.equal(result, expected)
  })
})

describe('heading_link', async () => {
  test('creates a wikilink to a given heading', () => {
    const linkable = '[[Note]]'
    const expected = '[[Note#Heading]]'
    const result = heading_link(linkable, 'Heading')

    assert.equal(result, expected)
  })

  test('drops aliases in links', () => {
    const linkable = '[[Note|Alias]]'
    const expected = '[[Note#Heading]]'
    const result = heading_link(linkable, 'Heading')

    assert.equal(result, expected)
  })

  test('allows specifying a new alias', () => {
    const linkable = '[[Note|Alias]]'
    const expected = '[[Note#Heading|Alias 2]]'
    const result = heading_link(linkable, 'Heading', 'Alias 2')

    assert.equal(result, expected)
  })
})
