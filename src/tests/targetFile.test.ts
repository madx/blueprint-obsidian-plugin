import { Result } from '@bloodyowl/boxed'
import { assert, describe, test } from 'vitest'
import { readTargetFile, TargetFile } from '../targetFile'
import { loadCase, TestCase } from './testUtils'

function buildExpected(
  testCase: TestCase,
  overrides?: Partial<TargetFile>,
): Result<TargetFile, unknown> {
  return Result.Ok({
    file: testCase.file,
    source: testCase.source,
    frontmatter: {},
    sections: testCase.metadata.sections!,
    ...overrides,
  })
}

describe('readTargetFile', async () => {
  test('reads a target file into the corresponding data structure', async () => {
    const testCase = await loadCase('para')
    const expected = buildExpected(testCase)
    const result = readTargetFile(testCase.file, testCase.source, testCase.metadata)

    assert.deepEqual(result, expected)
  })

  test('handles empty files', async () => {
    const testCase = await loadCase('empty')
    const expected = buildExpected(testCase, {
      sections: [],
    })
    const result = readTargetFile(testCase.file, testCase.source, testCase.metadata)

    assert.deepEqual(result, expected)
  })

  test('extracts the frontmatter from the file', async () => {
    const testCase = await loadCase('frontmatter_para')
    const expected = buildExpected(testCase, {
      frontmatter: { key: 'value' },
    })
    const result = readTargetFile(testCase.file, testCase.source, testCase.metadata)

    assert.deepEqual(result, expected)
  })
})
