# Blueprint Obsidian Plugin

[Blueprint][blueprint] is a templating plugin for [Obsidian][obsidian]. 
It lets you enforce per-note templates, with support for frontmatter properties interpolation, repeatable applications, and more!
Blueprint templates use the [Nunjucks][nunjucks] templating engine, with additional features.


## Install

Currently, the easiest way to install Blueprint is through [BRAT][brat] or manually by building it locally.

## Documentation

> [!NOTE]
> I still need to write proper documentation for the plugin.
> In the meantime, here are a few bullet points about how it works.

- Store your templates as `.njk` files in a folder in your Vault
- Add a `blueprint` property to your note with a link to the desired Blueprint file
- Run the `Blueprint: Execute blueprint in current file` command to apply your template
- You can use a special notation to have a block under a heading with default contents. 
  Subsequent applications of the blueprint will keep your modifications to this section

```jinja2
## Heading

{% section "Heading" %}
This is the default content of this section.
{% endsection %}
```

[blueprint]: https://github.com/madx/blueprint-obsidian-plugin
[obsidian]: https://obsidian.md/
[nunjucks]: https://mozilla.github.io/nunjucks/
[brat]: https://github.com/TfTHacker/obsidian42-brat
