import { readFileSync } from 'fs'
import path, { isAbsolute, join, dirname } from 'path'

import { importPattern } from './constants'
import * as customImport from './customImport'

export const defaultResolve = (src, file) => path.resolve(dirname(file), src)

export const requireGql = (
  filepath,
  { resolve = defaultResolve } = {}
) => {
  filepath = isAbsolute(filepath) ? filepath : join(callerDirname(), filepath)
  const source = readFileSync(filepath).toString()
  const imports = customImport.getFilepaths(source, filepath, resolve)

  if (imports.length === 0) {
    return source
  }

  // Resolve all #import statements (types, etc) recursively and concat them to the main source.
  const importSources = customImport.getImportSources(source, filepath, resolve)
    .map(stripImportStatements)
    .join('')

  return `${stripImportStatements(source)}${importSources}`
}

function callerDirname() {
  // To avoid dependencies, I borrowed this from gh (sindresorhus/callsites/blob/master/index.js)
  const _ = Error.prepareStackTrace
  Error.prepareStackTrace = (_, stack) => stack
  const stack = new Error().stack.slice(1)
  Error.prepareStackTrace = _
  // End borrowed code

  const caller = stack.find(c => c.getTypeName() !== null)
  return dirname(caller.getFileName())
}

function stripImportStatements(src) {
  return src.replace(importPattern, '')
}
