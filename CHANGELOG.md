## Changelog

### 0.11.0

- Blueprint files are markdown by default: a blueprint is recognised by the filename suffix `.blueprint.md` rather than the `.blueprint` extension, so it is an ordinary note that syncs, renders and opens like any other
- The suffix is configurable in settings — set it back to `.blueprint` for the previous behaviour, including the plugin's own editor and its optional syntax highlighting, which only apply to a non-markdown suffix
- Recognition tests the file *name*, not `file.extension` (`Book.blueprint.md` has extension `md`). Existing files are never renamed, and no file type is registered for a markdown suffix
- The blueprint picker and notices show a blueprint's bare name rather than its full filename
- Fix: a blueprint is never treated as a note *with* a blueprint. Markdown blueprints are indexed like any note, so a template carrying a `blueprint:` line could be swept up by "update all notes with blueprints" and rendered into itself
- Fix: remove a duplicate `BLUEPRINT_FILE_EXTENSION` declaration in `utils.ts` that shadowed the one in `constants.ts`

### 0.10.0

- Expose a public scripting API: `plugin.api.applyToFile(file)` applies a note's blueprint headlessly (no open note required) and returns an awaitable promise
- Abort instead of overwriting when a note's content changes while its blueprint is rendering
- Expose `EnsureError` on the api object so consumers can distinguish precondition failures from render errors

### 0.9.0

- Add a `___REST___` pseudo-section for note-owned structure
- Expose the note's headings to the template context

### 0.2.0

- BREAKING CHANGE: Blueprint files should now use the `.blueprint` file extension.
- Allow setting frontmatter properties using a blueprint
- Allow updating all notes using a given blueprint
- Add `moment` as a global variable available in blueprints
- Update documentation and wordings

### 0.1.3

- Fix a requirement for the plugin review

### 0.1.2

- Remove a debug command that shouldn't have been there 😅

### 0.1.1

- Update plugin id and description

### 0.1.0

- Split CHANGELOG from README
- Use the MIT license
- Add release workflow

### 0.0.7

- Add a bunch of tests to make sure regressions are catched earlier

### 0.0.6

- Fix section processing that was making some sections disappear (issues #7 & #8)

### 0.0.5

- Add `to_embed` and `split` filters.
- Show error popups on template errors.

### 0.0.3 - 0.0.4

- Improve documentation.

### 0.0.2

- Improve section handling by keeping content from sub-sections.
- Add a special `__TOP__` section to include everything found before the first heading.

### 0.0.1

- Proper release for BRAT.
- Allow applying Blueprints to all files in a folder.
- Code cleanup after initial proof-of-concept.


