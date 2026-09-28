import * as nunjucks from 'nunjucks'

class ObsidianLoader extends nunjucks.Loader {
  async: true

  constructor() {
    super()
    this.async = true
  }

  getSource(path: string, callback: nunjucks.Callback<Error, nunjucks.LoaderSource>) {
    callback(null, {
      src: '[DEPRECATED] Support for template loading has been removed in Blueprint 0.10. Please use Blueprint composition instead.',
      path,
      noCache: true,
    })
  }
}

export { ObsidianLoader }
