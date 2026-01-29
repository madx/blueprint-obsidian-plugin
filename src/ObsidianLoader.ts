import * as nunjucks from 'nunjucks'
import { App } from 'obsidian'
import { BLUEPRINT_FILE_EXTENSION } from './constants'

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
      if (!path.endsWith(`.${BLUEPRINT_FILE_EXTENSION}`)) {
        this.getSource(`${path}.${BLUEPRINT_FILE_EXTENSION}`, callback)
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
