import * as nunjucks from "nunjucks"

/**
 * This file is poorly typed, mainly because nunjucks' parser API is also poorly typed
 */

class SectionExtension {
  getSection: (heading: string, defaultContent?: string) => string
  tags = ['section']

  constructor(getSection: (heading: string, defaultContent?: string) => string) {
    this.getSection = getSection
  }

  // nunjucks' parser API is undocumented so we don't get type info here
  parse(parser: any, nodes: any) {
    const tok = parser.nextToken();

    const args = parser.parseSignature(null, true);
    parser.advanceAfterBlockEnd(tok.value);

    const body = parser.parseUntilBlocks('endsection');

    parser.advanceAfterBlockEnd();

    return new nodes.CallExtension(this, 'run', args, [body]);
  }

  run(_: any, heading: string, defaultContent: () => string) {
    return new nunjucks.runtime.SafeString(this.getSection(heading, defaultContent().trim()))
  }
}

export { SectionExtension }
