import { assert, describe, test } from 'vitest'
import { filters } from '../filters'

const { prefixLines, embed } = filters

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
