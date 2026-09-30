import * as fs from 'fs/promises'
import * as path from 'path'
import { CachedMetadata } from 'obsidian'
import { TFileLike } from '../types'
import { readTargetFile, TargetFile } from '../targetFile'
import { Blueprint, readBlueprint } from '../blueprint'

export type TestCase = { file: TFileLike; source: string; metadata: CachedMetadata }
export async function loadCase(name: string): Promise<TestCase> {
  if (name in loadCase.__cache__) {
    return loadCase.__cache__[name]
  }

  try {
    const jsonRaw = await fs.readFile(
      path.join(import.meta.dirname, 'fixtures', `${name}.json`),
      'utf8',
    )
    const testCase = JSON.parse(jsonRaw) as TestCase
    loadCase.__cache__[name] = testCase

    return testCase
  } catch (error) {
    throw `Unable to load test case ${name}`
  }
}
loadCase.__cache__ = {} as Record<string, TestCase>

export async function loadTargetFile(name: string): Promise<TargetFile> {
  const testCase = await loadCase(name)

  const targetFileResult = readTargetFile(testCase.file, testCase.source, testCase.metadata)

  if (targetFileResult.isError()) {
    throw `Unable to load ${name}`
  }

  return targetFileResult.get()
}

export async function loadBlueprint(name: string): Promise<Blueprint> {
  if (name in loadBlueprint.__cache__) {
    return loadBlueprint.__cache__[name]
  }

  try {
    const source = await fs.readFile(
      path.join(import.meta.dirname, 'fixtures', `${name}.blueprint`),
      'utf8',
    )

    const blueprintResult = readBlueprint(source)

    if (blueprintResult.isError()) {
      throw `Unable to load ${name}`
    }

    const blueprint = blueprintResult.get()
    loadBlueprint.__cache__[name] = blueprint

    return blueprint
  } catch (error) {
    throw `Unable to load test case ${name}`
  }
}
loadBlueprint.__cache__ = {} as Record<string, Blueprint>
