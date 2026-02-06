import { assert, describe, test } from 'vitest'
import { toEmbed } from '../filters'

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
