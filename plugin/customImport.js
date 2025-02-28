import { readFileSync } from 'fs'

import { newlinePattern, importPattern } from './constants'

export function getFilepaths(src, relFile, resolve) {
  return src.split(newlinePattern).reduce(
    (acc, line) => {
      const matches = importPattern.exec(line)
      if (matches) {
        const [, importPath] = matches
        acc.push(resolve(importPath, relFile))
      }
      return acc
    },
    []
  )
}

function getSources(filepath, resolve, acc) {
  const path = filepath.replace(/'/g, '')

  const importSrc = readFileSync(path).toString()
  const nestedPaths = getFilepaths(importSrc, filepath, resolve)

  const srcAndPath = { src: importSrc, path }

  const srcs =
    nestedPaths.length > 0
      ? [
        ...nestedPaths.reduce((srcArr, fp) => [...srcArr, ...getSources(fp, resolve, [])], []),
        srcAndPath
      ]
      : [srcAndPath]
  return [...srcs, ...acc]
}

export function getImportSources(rootSource, filepath, resolve) {
  const imports = getFilepaths(rootSource, filepath, resolve)

  const sources = imports.reduce((acc, fp) => {
    return [...acc, ...getSources(fp, resolve, [])]
  }, []);

  const finalSources = sources.filter((srcAndPath, index, array) => array
    .findIndex(item => item.path === srcAndPath.path) === index)
    .map(srcAndPath => srcAndPath.src)

  return finalSources;
}
