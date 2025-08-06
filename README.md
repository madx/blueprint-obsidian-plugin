# Blueprint Obsidian Plugin

[Blueprint][blueprint] is a templating plugin for [Obsidian][obsidian].
It lets you enforce per-note templates, with support for frontmatter properties interpolation, repeatable applications, and more!
Blueprint templates use the [Nunjucks][nunjucks] templating engine, with additional features.

## Install

Currently, the easiest way to install Blueprint is through [BRAT][brat] or manually by building it locally.

## Documentation

> [!NOTE]
> This documentation might be a bit basic, feel free to reach me on Obsidian's Discord server, I'm @koleir there.

Blueprints are template files that allow you to enforce the layout of a note while keeping the ability to edit the note itself for modifications.
It relies on logical sections in your notes, separated by headings.

Blueprints are built on top of the [Nunjucks][nunjucks] template language, adding some special markup for handling the sections in your notes.

To start using Blueprint, create a template with the `.njk` file extension in your Vault, and link it in your note's `blueprint` property.

You can apply the Blueprint by executing the `Blueprint: Execute current file's Blueprint` command, or by right clicking on it in the File Explorer then choosing `Apply Blueprint`.

You can apply the referenced Blueprint for all files of a given folder by right-clicking on the folder in the File Explorer and choosing `Apply all Blueprints`.

### Syntax

In your templates, you have access to a new Nunjucks block type called `section`. 
It takes an heading name as it's first argument, and the contents of the block will be used as the default content when applying the Blueprint.
If the notes you are applying a Blueprint to already has the target heading, it's content as well as all its sub-sections will be used instead of the default text.

**_Example_**: Let's say you have the following Blueprint:

```jinja2
## Heading

{% section "Heading" %}
This is the default content of this section.
{% endsection %}
```

Applying it to a blank note will yield the following content:

```markdown
## Heading

This is the default content of this section.
```

If you edit the note this way:

```markdown
## Heading

This is the updated content of this section.
```

Then subsequent applications of the Blueprint will keep the text untouched.

Blueprint also understands a special `__TOP__` section which includes everything before the first header.

## Changelog

### 0.0.2

- Improve section handling by keeping content from sub-sections
- Add a special `__TOP__` section to include everything found before the first heading.

### 0.0.1

- Proper release for BRAT
- Allow applying Blueprints to all files in a folder
- Code cleanup after initial proof-of-concept

[blueprint]: https://github.com/madx/blueprint-obsidian-plugin
[obsidian]: https://obsidian.md/
[nunjucks]: https://mozilla.github.io/nunjucks/
[brat]: https://github.com/TfTHacker/obsidian42-brat
