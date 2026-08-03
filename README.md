# 📘 Blueprint Obsidian Plugin

[Blueprint][blueprint:plugin] is a templating plugin for [Obsidian][obsidian].
It lets you propagate changes in your templates to your notes without losing content, use frontmatter properties in your notes, and quickly create new notes from a template!
Blueprint templates use the [Nunjucks][nunjucks] templating engine, plus additional features. It's super easy to pick up, yet very powerful.

## [Documentation][blueprint:docs]

## Scripting API

Other plugins and user scripts (Templater, QuickAdd, etc.) can apply a note's blueprint programmatically, without the note being open or active:

```js
const blueprint = app.plugins.plugins.blueprint
await blueprint.api.applyToFile(file) // file: TFile with a `blueprint` frontmatter link
```

`applyToFile` resolves once the note has been updated. The note's metadata must already be indexed: if your script just created or modified the note, wait for the metadata cache to reflect the change (e.g. `metadataCache.on('changed', ...)`) before calling.

The promise rejects with `EnsureError` (available as `blueprint.api.EnsureError` for `instanceof` checks) when a precondition fails — the note has no `blueprint` link, the blueprint cannot be resolved, the note's metadata is not cached, the note changed while the blueprint was rendering, or the plugin is not loaded — and with the underlying template error when rendering fails. (The *Apply blueprint* command is unchanged: it acts on the active note and reports errors via notices.)

## Acknowledgements

Thanks to all the early adopters and all the valuable feedback they provided, in particular [SlRvb](https://github.com/SlRvb), [Leah](https://github.com/leah-ferguson), and users Pickleberry and Calavera on Discord.

## (Almost) No AI

This plugin is mostly developed WITHOUT the use of AI-assisted development tools such as Copilot or Claude Code.
I will not accept code contributions that are blatantly vibe-coded.
I occasionally use Claude Web to improve the documentation quality (I am not a native English speaker).

[blueprint:plugin]: https://community.obsidian.md/plugins/blueprint
[blueprint:code]: https://github.com/madx/blueprint-obsidian-plugin
[blueprint:docs]: https://publish.obsidian.md/blueprint
[obsidian]: https://obsidian.md/
[nunjucks]: https://mozilla.github.io/nunjucks/
