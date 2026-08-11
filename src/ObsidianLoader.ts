import * as nunjucks from 'nunjucks'
import { App } from 'obsidian'


class ObsidianLoader extends nunjucks.Loader {
  app: App
  async: true
  suffix: string

  constructor(app: App, suffix: string) {
    super()
    this.async = true
    this.app = app
    this.suffix = suffix
  }

  getSource(path: string, callback: nunjucks.Callback<Error, nunjucks.LoaderSource>) {
    const file = this.app.vault.getFileByPath(path)

    if (!file) {
      // `{% extends "Base" %}` names a blueprint the way the user does; the suffix
      // is how it is stored, so try it once before giving up.
      if (!path.endsWith(this.suffix)) {
        this.getSource(`${path}${this.suffix}`, callback)
        return
      }
      const error = new Error('No such template')
      callback(error, null)
      return
    }

    this.app.vault
      .cachedRead(file)
      .then((data) => {
        callback(null, {
          src: data,
          path,
          noCache: true,
        })
      })
      .catch((err) => callback(err, null))
  }
}

export { ObsidianLoader }
