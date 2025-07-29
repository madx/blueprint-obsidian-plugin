import {
  Plugin,
} from "obsidian";
import * as nunjucks from "nunjucks"
import { currentFileHasBlueprint } from "./utils";
import { executeCurrentFileBlueprint } from "./commands";


export default class BlueprintPlugin extends Plugin {
  async onload() {
    nunjucks.configure({ autoescape: false, trimBlocks: true })

    this.addCommand({
      id: "execute-current-file-blueprint",
      name: "Execute current file's blueprint",
      checkCallback: (checking: boolean) => {
        if (checking) {
          return currentFileHasBlueprint(this.app)
        }

        executeCurrentFileBlueprint(this.app, checking)
        return true
      }
    })
  }
}
