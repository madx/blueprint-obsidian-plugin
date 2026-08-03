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

`applyToFile` resolves once the note has been updated and rejects with an error if the note has no blueprint, the blueprint cannot be resolved, or rendering fails. (The *Apply blueprint* command is unchanged: it acts on the active note and reports errors via notices.)

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
