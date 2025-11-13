import * as fs from 'fs/promises'
import { CachedMetadata } from 'obsidian'
import * as path from 'path'
import { assert, describe, test } from 'vitest'
import { parseSections, TOP_SECTION_ID } from '../parseSections'

type Case = { metadata: CachedMetadata; content: string }
async function loadCase(name: string): Promise<Case> {
  if (name in loadCase.__cache__) {
    return loadCase.__cache__[name]
  }

  const jsonRaw = await fs.readFile(path.join(import.meta.dirname, 'cases', `${name}.json`), 'utf8')
  const metadata = JSON.parse(jsonRaw)
  const content = await fs.readFile(path.join(import.meta.dirname, 'cases', `${name}.md`), 'utf8')

  return { metadata, content } as Case
}
loadCase.__cache__ = {} as Record<string, Case>

describe('parseSections', async () => {
  test('extracts an empty H1 header', async () => {
    const singleH1 = await loadCase('single_h1')
    const output = parseSections(singleH1.metadata, singleH1.content)

    assert.hasAllKeys(output, [TOP_SECTION_ID, 'H1'])
    assert.isEmpty(output[TOP_SECTION_ID])
    assert.isEmpty(output.H1)
  })

  test('extracts an empty H2 header', async () => {
    const singleH2 = await loadCase('single_h2')
    const output = parseSections(singleH2.metadata, singleH2.content)

    assert.hasAllKeys(output, [TOP_SECTION_ID, 'H2'])
    assert.isEmpty(output[TOP_SECTION_ID])
    assert.isEmpty(output.H2)
  })

  test('extracts an empty H3 header', async () => {
    const singleH3 = await loadCase('single_h3')
    const output = parseSections(singleH3.metadata, singleH3.content)

    assert.hasAllKeys(output, [TOP_SECTION_ID, 'H3'])
    assert.isEmpty(output[TOP_SECTION_ID])
    assert.isEmpty(output.H3)
  })

  test('extracts an H1 followed by a paragraph', async () => {
    const h1ThenParagraph = await loadCase('h1_then_paragraph')
    const output = parseSections(h1ThenParagraph.metadata, h1ThenParagraph.content)

    assert.hasAllKeys(output, [TOP_SECTION_ID, 'H1'])
    assert.isEmpty(output[TOP_SECTION_ID])
    assert.equal(output.H1, 'Paragraph')
  })

  test('extracts an H1 followed by a paragraph, separated by a blank line', async () => {
    const h1ThenBlankLineThenParagraph = await loadCase('h1_then_blank_line_then_paragraph')
    const output = parseSections(
      h1ThenBlankLineThenParagraph.metadata,
      h1ThenBlankLineThenParagraph.content,
    )

    assert.hasAllKeys(output, [TOP_SECTION_ID, 'H1'])
    assert.isEmpty(output[TOP_SECTION_ID])
    assert.equal(output.H1, 'Paragraph')
  })

  test('extracts an H1 followed by an H2 and a paragraph', async () => {
    const h1ThenH2ThenParagraph = await loadCase('h1_then_h2_then_paragraph')
    const output = parseSections(h1ThenH2ThenParagraph.metadata, h1ThenH2ThenParagraph.content)

    assert.hasAllKeys(output, [TOP_SECTION_ID, 'H1', 'H2'])
    assert.isEmpty(output[TOP_SECTION_ID])
    assert.equal(output.H1, '## H2\nParagraph')
    assert.equal(output.H2, 'Paragraph')
  })

  test('extracts an H1 followed by an H2 and another h1', async () => {
    const h1H2H1 = await loadCase('h1_h2_h1')
    const output = parseSections(h1H2H1.metadata, h1H2H1.content)

    assert.hasAllKeys(output, [TOP_SECTION_ID, 'H1_1', 'H2', 'H1_2'])
    assert.isEmpty(output[TOP_SECTION_ID])
    assert.equal(output.H1_1, '## H2')
    assert.isEmpty(output.H2)
    assert.isEmpty(output.H1_2)
  })

  test('extracts an H1 followed by a paragraph, an H2 and another h1', async () => {
    const h1ParaH2H1 = await loadCase('h1_para_h2_h1')
    const output = parseSections(h1ParaH2H1.metadata, h1ParaH2H1.content)

    assert.hasAllKeys(output, [TOP_SECTION_ID, 'H1_1', 'H2', 'H1_2'])
    assert.isEmpty(output[TOP_SECTION_ID])
    assert.equal(output.H1_1, 'Paragraph\n## H2')
    assert.isEmpty(output.H2)
    assert.isEmpty(output.H1_2)
  })

  test('extracts an H1 followed by an H2, a paragraph and another h1', async () => {
    const h1H2ParaH1 = await loadCase('h1_h2_para_h1')
    const output = parseSections(h1H2ParaH1.metadata, h1H2ParaH1.content)

    assert.hasAllKeys(output, [TOP_SECTION_ID, 'H1_1', 'H2', 'H1_2'])
    assert.isEmpty(output[TOP_SECTION_ID])
    assert.equal(output.H1_1, '## H2\nParagraph')
    assert.equal(output.H2, 'Paragraph')
    assert.isEmpty(output.H1_2)
  })

  test('extracts an H1 followed by a H3, a paragraph, an H2 and another paragraph', async () => {
    const h1H2ParaH1 = await loadCase('h1_h3_para_h2_para')
    const output = parseSections(h1H2ParaH1.metadata, h1H2ParaH1.content)

    assert.hasAllKeys(output, [TOP_SECTION_ID, 'H1', 'H3', 'H2'])
    assert.isEmpty(output[TOP_SECTION_ID])
    assert.equal(output.H1, '### H3\nParagraph 1\n## H2\nParagraph 2')
    assert.equal(output.H3, 'Paragraph 1')
    assert.equal(output.H2, 'Paragraph 2')
  })

  test('extracts an H1 followed by a H3, a paragraph, an H2 and another paragraph', async () => {
    const h1H2ParaH1 = await loadCase('h1_h3_para_h2_para')
    const output = parseSections(h1H2ParaH1.metadata, h1H2ParaH1.content)

    assert.hasAllKeys(output, [TOP_SECTION_ID, 'H1', 'H3', 'H2'])
    assert.isEmpty(output[TOP_SECTION_ID])
    assert.equal(output.H1, '### H3\nParagraph 1\n## H2\nParagraph 2')
    assert.equal(output.H3, 'Paragraph 1')
    assert.equal(output.H2, 'Paragraph 2')
  })

  test('extracts an H2 followed by a H3, a paragraph, another H2 and another paragraph', async () => {
    const h2H2ParaH1 = await loadCase('h2_h3_para_h2_para')
    const output = parseSections(h2H2ParaH1.metadata, h2H2ParaH1.content)

    assert.hasAllKeys(output, [TOP_SECTION_ID, 'H2_1', 'H3', 'H2_2'])
    assert.isEmpty(output[TOP_SECTION_ID])
    assert.equal(output.H2_1, '### H3\nParagraph 1')
    assert.equal(output.H3, 'Paragraph 1')
    assert.equal(output.H2_2, 'Paragraph 2')
  })

  test(`extracts all non-heading content in the ${TOP_SECTION_ID} section`, async () => {
    const topH1 = await loadCase('top_h1')
    const output = parseSections(topH1.metadata, topH1.content)

    assert.hasAllKeys(output, [TOP_SECTION_ID, 'H1'])
    assert.equal(output[TOP_SECTION_ID], 'Paragraph\n\n- list item 1\n- list item 2')
    assert.isEmpty(output.H1)
  })
})
