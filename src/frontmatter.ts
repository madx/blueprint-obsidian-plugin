import { Result } from '@bloodyowl/boxed'
import { parseYaml } from 'obsidian'
import { ErrorMessage } from './types'

type Frontmatter = Record<string, unknown>

function parseFrontmatter(source: string): Result<Frontmatter, ErrorMessage> {
  const frontmatter = parseYaml(source) ?? {}

  if (typeof frontmatter !== 'object') {
    return Result.Error('Invalid frontmatter')
  }

  return Result.Ok(frontmatter as Frontmatter)
}

export { type Frontmatter, parseFrontmatter }
