import * as nunjucks from 'nunjucks'
import { App } from 'obsidian'

class ObsidianLoader extends nunjucks.Loader {
  app: App
  async: true

  constructor(app: App) {
    super()
    this.async = true
    this.app = app
  }

  getSource(path: string, callback: nunjucks.Callback<Error, nunjucks.LoaderSource>) {
    const file = this.app.vault.getFileByPath(path)

    if (!file) {
      if (!path.endsWith('.njk')) {
        this.getSource(`${path}.njk`, callback)
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
