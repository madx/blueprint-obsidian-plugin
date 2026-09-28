import { assert, describe, test } from 'vitest'
import { Result } from '@bloodyowl/boxed'
import { parseFrontmatter } from '../frontmatter'

describe('parseFrontmatter', async () => {
  test('returns an object from the parsed YAML object document', () => {
    const expected = Result.Ok({ key: 'value' })
    const result = parseFrontmatter("key: 'value'")

    assert.deepEqual(result, expected)
  })

  test('returns an empty object for empty documents', () => {
    const expected = Result.Ok({})
    const result = parseFrontmatter('')

    assert.deepEqual(result, expected)
  })

  test('returns an empty object for null documents', () => {
    const expected = Result.Ok({})
    const result = parseFrontmatter('null')

    assert.deepEqual(result, expected)
  })

  test('returns an error for other types of YAML documents', () => {
    const expected = Result.Error('Invalid frontmatter')
    const result = parseFrontmatter('hello')

    assert.equal(result, expected)
  })
})
