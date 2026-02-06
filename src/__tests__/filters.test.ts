import { assert, describe, test } from 'vitest'
import { prefixLines, toEmbed } from '../filters'

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

describe('toEmbed', async () => {
  test('returns an empty string when link is empty', () => {
    assert.isEmpty(toEmbed(''))
  })

  test('returns an embed for WikiLinks', () => {
    const expected = '![[link]]'
    assert.equal(toEmbed('[[link]]'), expected)
  })

  test('returns an embed with display text for WikiLinks', () => {
    const expected = '![[link|display]]'
    assert.equal(toEmbed('[[link]]', 'display'), expected)
  })

  test('returns an embed for URLs', () => {
    const expected = '![](https://example.com)'
    assert.equal(toEmbed('https://example.com'), expected)
  })

  test('returns an embed with display text for URLs', () => {
    const expected = '![](https://example.com)'
    assert.equal(toEmbed('https://example.com'), expected)
  })
})
