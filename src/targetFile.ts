import { Result } from '@bloodyowl/boxed'
import { CachedMetadata, SectionCache } from 'obsidian'
import { ErrorMessage, TFileLike } from './types'
import { Frontmatter } from './frontmatter'

export type TargetFile = {
  file: TFileLike
  source: string
  frontmatter: Frontmatter
  sections: SectionCache[]
}

export function readTargetFile(
  file: TFileLike,
  source: string,
  metadata: CachedMetadata,
): Result<TargetFile, ErrorMessage[]> {
  return Result.Ok({
    file,
    source,
    frontmatter: metadata.frontmatter ?? {},
    sections: metadata.sections ?? [],
  })
}
