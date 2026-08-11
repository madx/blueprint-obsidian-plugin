import { describe, expect, test } from 'vitest'
import {
  blueprintDisplayName,
  DEFAULT_BLUEPRINT_SUFFIX,
  extensionToRegister,
  LEGACY_BLUEPRINT_SUFFIX,
  normalizeSuffix,
} from '../constants'

describe('extensionToRegister', () => {
  test('claims nothing for a markdown suffix', () => {
    // Registering `md` would route every note in the vault to the blueprint view.
    expect(extensionToRegister(DEFAULT_BLUEPRINT_SUFFIX)).toBeNull()
    expect(extensionToRegister('.anything.md')).toBeNull()
  })

  test('claims the extension for a standalone suffix', () => {
    expect(extensionToRegister(LEGACY_BLUEPRINT_SUFFIX)).toBe('blueprint')
    expect(extensionToRegister('.tpl')).toBe('tpl')
  })

  test('claims nothing for a suffix with no extension left', () => {
    expect(extensionToRegister('.')).toBeNull()
  })
})

describe('normalizeSuffix', () => {
  test('keeps a well-formed suffix verbatim', () => {
    expect(normalizeSuffix('.blueprint')).toBe('.blueprint')
    expect(normalizeSuffix('  .bp.md  ')).toBe('.bp.md')
  })

  test('falls back rather than matching everything or nothing', () => {
    // A suffix of '' ends every filename; 'blueprint' with no dot would match
    // `myblueprint.md` too. Both are worse than ignoring the setting.
    expect(normalizeSuffix('')).toBe(DEFAULT_BLUEPRINT_SUFFIX)
    expect(normalizeSuffix('   ')).toBe(DEFAULT_BLUEPRINT_SUFFIX)
    expect(normalizeSuffix('blueprint')).toBe(DEFAULT_BLUEPRINT_SUFFIX)
    expect(normalizeSuffix('.')).toBe(DEFAULT_BLUEPRINT_SUFFIX)
    expect(normalizeSuffix(undefined)).toBe(DEFAULT_BLUEPRINT_SUFFIX)
  })
})

describe('blueprintDisplayName', () => {
  test('strips the suffix', () => {
    expect(blueprintDisplayName('Book.blueprint.md', '.blueprint.md')).toBe('Book')
    expect(blueprintDisplayName('Book.blueprint', '.blueprint')).toBe('Book')
  })

  test('leaves a name that does not carry the suffix alone', () => {
    expect(blueprintDisplayName('Book.md', '.blueprint.md')).toBe('Book.md')
  })
})
