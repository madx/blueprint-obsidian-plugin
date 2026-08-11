/**
 * How a blueprint file is recognised.
 *
 * Historically this was an Obsidian *extension* — `Book.blueprint`, a non-markdown
 * file the plugin registered a view for. The default is now the softer
 * `Book.blueprint.md`: still unmistakably a blueprint by name, but a plain markdown
 * note to everything else, which means no `registerExtensions` call, no custom view
 * to maintain, and a file that opens, syncs and renders like the rest of the vault.
 *
 * The consequence for the code is that recognition can no longer test
 * `file.extension`: for `Book.blueprint.md` that is `md`. Everything tests the
 * **name suffix** instead, which is correct for both styles.
 */

/** The suffix a blueprint file's name ends with. Configurable; this is the default. */
const DEFAULT_BLUEPRINT_SUFFIX = '.blueprint.md' as const

/** The pre-0.11 suffix: a non-markdown file with its own registered view. */
const LEGACY_BLUEPRINT_SUFFIX = '.blueprint' as const

/**
 * Obsidian only needs `registerExtensions` for a file it would not otherwise open.
 * A `*.blueprint.md` is markdown and is already handled — registering `md` would
 * hijack every note in the vault, so the extension is only ever claimed for a
 * suffix that is not markdown.
 */
function extensionToRegister(suffix: string): string | null {
  if (suffix.endsWith('.md')) return null
  const ext = suffix.replace(/^\./, '')
  return ext.length > 0 ? ext : null
}

/**
 * A usable suffix starts with a dot and has something after it. Anything else (an
 * empty setting, whitespace, a bare word) falls back to the default rather than
 * matching every file in the vault or none of them.
 */
function normalizeSuffix(raw: string | undefined): string {
  const trimmed = (raw ?? '').trim()
  if (!trimmed.startsWith('.') || trimmed.length < 2) return DEFAULT_BLUEPRINT_SUFFIX
  return trimmed
}

/** The name a blueprint is known by: its filename minus the suffix. */
function blueprintDisplayName(fileName: string, suffix: string): string {
  return fileName.endsWith(suffix) ? fileName.slice(0, -suffix.length) : fileName
}

export {
  blueprintDisplayName,
  DEFAULT_BLUEPRINT_SUFFIX,
  extensionToRegister,
  LEGACY_BLUEPRINT_SUFFIX,
  normalizeSuffix,
}
