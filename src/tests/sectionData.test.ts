import { assert, describe, test } from 'vitest'
import { parseSectionData, TOP_SECTION_ID } from '../sectionData'
import { loadTargetFile } from './testUtils'

describe('parseSectionData', async () => {
  test('extracts an empty H1 header', async () => {
    const h1 = await loadTargetFile('h1')
    const output = parseSectionData(h1)

    assert.hasAllKeys(output.byName, [TOP_SECTION_ID, 'H1'])
    assert.isEmpty(output.byName[TOP_SECTION_ID])
    assert.isEmpty(output.byName.H1)
  })

  test('extracts an empty H2 header', async () => {
    const h2 = await loadTargetFile('h2')
    const output = parseSectionData(h2)

    assert.hasAllKeys(output.byName, [TOP_SECTION_ID, 'H2'])
    assert.isEmpty(output.byName[TOP_SECTION_ID])
    assert.isEmpty(output.byName.H2)
  })

  test('extracts an empty H3 header', async () => {
    const h3 = await loadTargetFile('h3')
    const output = parseSectionData(h3)

    assert.hasAllKeys(output.byName, [TOP_SECTION_ID, 'H3'])
    assert.isEmpty(output.byName[TOP_SECTION_ID])
    assert.isEmpty(output.byName.H3)
  })

  test('extracts an H1 followed by a paragraph', async () => {
    const h1Para = await loadTargetFile('h1_para')
    const output = parseSectionData(h1Para)

    assert.hasAllKeys(output.byName, [TOP_SECTION_ID, 'H1'])
    assert.isEmpty(output.byName[TOP_SECTION_ID])
    assert.equal(output.byName.H1, 'Paragraph')
  })

  test('extracts two consecutive H1s', async () => {
    const h1H1 = await loadTargetFile('h1_h1')
    const output = parseSectionData(h1H1)

    assert.hasAllKeys(output.byName, [TOP_SECTION_ID, 'H1_1', 'H1_2'])
    assert.isEmpty(output.byName[TOP_SECTION_ID])
    assert.isEmpty(output.byName.H1_1)
    assert.isEmpty(output.byName.H1_2)
  })

  test('extracts an H1 followed by a paragraph, separated by a blank line', async () => {
    const h1NlPara = await loadTargetFile('h1_nl_para')
    const output = parseSectionData(h1NlPara)

    assert.hasAllKeys(output.byName, [TOP_SECTION_ID, 'H1'])
    assert.isEmpty(output.byName[TOP_SECTION_ID])
    assert.equal(output.byName.H1, 'Paragraph')
  })

  test('extracts an H1 followed by an H2 and a paragraph', async () => {
    const h1ThenH2ThenParagraph = await loadTargetFile('h1_h2_para')
    const output = parseSectionData(h1ThenH2ThenParagraph)

    assert.hasAllKeys(output.byName, [TOP_SECTION_ID, 'H1', 'H2'])
    assert.isEmpty(output.byName[TOP_SECTION_ID])
    assert.equal(output.byName.H1, '## H2\nParagraph')
    assert.equal(output.byName.H2, 'Paragraph')
  })

  test('extracts an H1 followed by an H2 and another h1', async () => {
    const h1H2H1 = await loadTargetFile('h1_h2_h1')
    const output = parseSectionData(h1H2H1)

    assert.hasAllKeys(output.byName, [TOP_SECTION_ID, 'H1_1', 'H2', 'H1_2'])
    assert.isEmpty(output.byName[TOP_SECTION_ID])
    assert.equal(output.byName.H1_1, '## H2')
    assert.isEmpty(output.byName.H2)
    assert.isEmpty(output.byName.H1_2)
  })

  test('extracts an H1 followed by a paragraph, an H2 and another h1', async () => {
    const h1ParaH2H1 = await loadTargetFile('h1_para_h2_h1')
    const output = parseSectionData(h1ParaH2H1)

    assert.hasAllKeys(output.byName, [TOP_SECTION_ID, 'H1_1', 'H2', 'H1_2'])
    assert.isEmpty(output.byName[TOP_SECTION_ID])
    assert.equal(output.byName.H1_1, 'Paragraph\n## H2')
    assert.isEmpty(output.byName.H2)
    assert.isEmpty(output.byName.H1_2)
  })

  test('extracts an H1 followed by an H2, a paragraph and another h1', async () => {
    const h1H2ParaH1 = await loadTargetFile('h1_h2_para_h1')
    const output = parseSectionData(h1H2ParaH1)

    assert.hasAllKeys(output.byName, [TOP_SECTION_ID, 'H1_1', 'H2', 'H1_2'])
    assert.isEmpty(output.byName[TOP_SECTION_ID])
    assert.equal(output.byName.H1_1, '## H2\nParagraph')
    assert.equal(output.byName.H2, 'Paragraph')
    assert.isEmpty(output.byName.H1_2)
  })

  test('extracts an H1 followed by a H3, a paragraph, an H2 and another paragraph', async () => {
    const h1H2ParaH1 = await loadTargetFile('h1_h3_para_h2_para')
    const output = parseSectionData(h1H2ParaH1)

    assert.hasAllKeys(output.byName, [TOP_SECTION_ID, 'H1', 'H3', 'H2'])
    assert.isEmpty(output.byName[TOP_SECTION_ID])
    assert.equal(output.byName.H1, '### H3\nParagraph 1\n## H2\nParagraph 2')
    assert.equal(output.byName.H3, 'Paragraph 1')
    assert.equal(output.byName.H2, 'Paragraph 2')
  })

  test('extracts an H1 followed by a H3, a paragraph, an H2 and another paragraph', async () => {
    const h1H2ParaH1 = await loadTargetFile('h1_h3_para_h2_para')
    const output = parseSectionData(h1H2ParaH1)

    assert.hasAllKeys(output.byName, [TOP_SECTION_ID, 'H1', 'H3', 'H2'])
    assert.isEmpty(output.byName[TOP_SECTION_ID])
    assert.equal(output.byName.H1, '### H3\nParagraph 1\n## H2\nParagraph 2')
    assert.equal(output.byName.H3, 'Paragraph 1')
    assert.equal(output.byName.H2, 'Paragraph 2')
  })

  test('extracts an H2 followed by a H3, a paragraph, another H2 and another paragraph', async () => {
    const h2H2ParaH1 = await loadTargetFile('h2_h3_para_h2_para')
    const output = parseSectionData(h2H2ParaH1)

    assert.hasAllKeys(output.byName, [TOP_SECTION_ID, 'H2_1', 'H3', 'H2_2'])
    assert.isEmpty(output.byName[TOP_SECTION_ID])
    assert.equal(output.byName.H2_1, '### H3\nParagraph 1')
    assert.equal(output.byName.H3, 'Paragraph 1')
    assert.equal(output.byName.H2_2, 'Paragraph 2')
  })

  test(`extracts all non-heading content in the ${TOP_SECTION_ID} section`, async () => {
    const topH1 = await loadTargetFile('top_h1')
    const output = parseSectionData(topH1)

    assert.hasAllKeys(output.byName, [TOP_SECTION_ID, 'H1'])
    assert.equal(output.byName[TOP_SECTION_ID], 'Paragraph\n\n- list item 1\n- list item 2')
    assert.isEmpty(output.byName.H1)
  })

  test('extracts blocks with references as sections', async () => {
    const blockRefs = await loadTargetFile('block_refs')
    const output = parseSectionData(blockRefs)

    assert.hasAllKeys(output.byName, [TOP_SECTION_ID, 'para-ref', 'callout-ref'])
    assert.equal(output.byName['para-ref'], 'A paragraph ^para-ref')
    assert.equal(
      output.byName['callout-ref'],
      '> [!info] A callout ^callout-ref\n> With some content',
    )
  })
})
