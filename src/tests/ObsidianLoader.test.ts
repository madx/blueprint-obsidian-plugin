import { assert, describe, expect, test, vi } from 'vitest'
import { ObsidianLoader } from '../ObsidianLoader'

describe('ObsidianLoader', () => {
  test('is always async', () => {
    const loader = new ObsidianLoader()

    assert.isTrue(loader.async)
  })

  describe('getSource', () => {
    test('calls the given callback to show a deprecation notiece', () => {
      const path = 'some/path'
      const loader = new ObsidianLoader()
      const callback = vi.fn()

      loader.getSource(path, callback)

      expect(callback).toHaveBeenCalledWith(null, {
        path,
        noCache: true,
        src: expect.stringMatching('DEPRECATED'),
      })
    })
  })
})
