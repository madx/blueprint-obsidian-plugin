# 📘 Blueprint Obsidian Plugin

[Blueprint][blueprint] is a templating plugin for [Obsidian][obsidian].
It lets you enforce per-note templates, with support for frontmatter properties interpolation, non-destructive successive applications, and more!
Blueprint templates use the [Nunjucks][nunjucks] templating engine, with additional features.

## Install

Currently, the easiest way to install Blueprint is through [BRAT][brat] or manually by building it locally.

## Documentation

- [Setting-up your notes](#setting-up-your-notes)
- [Interpolation](#interpolation)
- [Sections](#sections)

> [!NOTE]
> This documentation might be a bit basic, feel free to reach me on Obsidian's Discord server, I'm @koleir there.

### Setting-up your notes

Blueprints are template files that allow you to enforce the layout of a note while keeping the ability to edit the note itself for modifications.
It relies on logical sections in your notes, separated by headings.

Blueprints are built on top of the [Nunjucks][nunjucks] template language, adding some special markup for handling the sections in your notes.

To start using Blueprint, create a template with the `.blueprint` file extension in your Vault, and link it in your note's `blueprint` property.

You can apply the blueprint by executing the `Blueprint: Apply blueprint` command, or by right clicking on it in the File Explorer then choosing `Apply blueprint`.

You can apply the referenced blueprint for all notes of a given folder by right-clicking on the folder in the File Explorer and choosing `Update all notes with blueprints`.

Finally, you can also update all notes using a blueprint either by using the `Blueprint: Update notes using this blueprint` command, or by right clicking on the blueprint file in the explorer and select the `Update notes using this blueprint` option in the context menu.

### Interpolation

Blueprint gives you access to your frontmatter properties as variables in the Nunjucks context. 
They keep the same type (text, number, list) as in the frontmatter.

You also have access to a `file` variable which is the underlying [file object](https://docs.obsidian.md/Reference/TypeScript+API/TFile), as well as a `frontmatter` variable which is your frontmatter again, as an object. This can be used if you have spaces and special characters in your frontmatter property names.

**_Example_**:

Note:


```markdown
---
count: 0
picture: "[[picture.jpg]]"
blueprint: "[[template.blueprint]]"
property with spaces: "Please don't put spaces in your property names."
---
```

Template:

```jinja
# {{file.basename}}

Count is {{count}}

Here's a fancy picture !{{picture}}

{{frontmatter['property with spaces']}}

```

Output:

```markdown
---
count: 0
picture: "[[picture.jpg]]"
blueprint: "[[template.blueprint]]"
---

Count is 0

Here's a fancy picture ![[picture.jpg]]

Please don't put spaces in your property names.
```

### Sections

In your templates, you have access to a new Nunjucks block type called `section`. 
It takes an heading name as it's first argument, and the contents of the block will be used as the default content when applying the blueprint.
If the notes you are applying a blueprint to already has the target heading, it's content as well as all its sub-sections will be used instead of the default text.

**_Example_**: Let's say you have the following blueprint:

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

Then subsequent applications of the blueprint will keep the text untouched.

Blueprint also understands a special `__TOP__` section which includes everything before the first header.

### Frontmatter

Blueprint lets you specify a default frontmatter for a note. 
It will only add missing properties from the frontmatter and will never remove properties that you defined yourself.

Properties defined in the blueprint can be used in subsequent interpolations.

```jinja
---
a_number: 21
a_string: "Hello"
---
{{a_string}}, twice the number is {{a_number * 2}}
```

Note content before blueprint application:

```markdown
---
a_string: "Hello, world!"
---
```

Note content after applying the blueprint:

```markdown
---
a_number: 21
a_string: "Hello, world!"
---
Hello, world!, twice the number is 42
```

### Custom filters

Blueprint adds a few custom filters to Nunjucks in order to make templating easier in the context of Obsidian

#### `to_embed`

Transforms a link to an embed, useful for having a link to an image in the frontmatter, but the actual embedded image in the note.
`to_embed` accepts an optional parameter that is used as the display text.
I the case of images, it allows settings their size as per [Obsidian's documentation](https://help.obsidian.md/embeds#Embed+an+image+in+a+note).

**Example:** Input frontmatter

```markdown
---
picture_url: "[[my_picture.jpg]]"
---
```

Template

```jinja
{{ picture_url | to_embed("150") }}
```

Output Markdown

```markdown
![[my_picture.jpg|150]]
```

#### `split`

Splits a string of characters along a given separator.
Basically the opposite of [`join`](https://mozilla.github.io/nunjucks/templating.html#join).

```jinja
{{ "a,b,c" | split(",") | join(":") }}
// Outputs a:b:c
```

### moment

Obsidian's default time manipulation library, [`moment`][moment] is exported as a global so you can use it in your blueprints.

```jinja
{% set relativeUpdatedAt= moment(updatedAt).fromNow() -%}
This note was updated {{relativeUpdatedAt}}.
```

[blueprint]: https://github.com/madx/blueprint-obsidian-plugin
[obsidian]: https://obsidian.md/
[nunjucks]: https://mozilla.github.io/nunjucks/
[brat]: https://github.com/TfTHacker/obsidian42-brat
[moment]: https://momentjs.com
