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

function _getSources(filepath, resolve, acc) {
  const path = filepath.replace(/'/g, '')

  const importSrc = readFileSync(path).toString()
  const nestedPaths = getFilepaths(importSrc, filepath, resolve)

  const srcAndPath = { src: importSrc, path }

  const srcs =
    nestedPaths.length > 0
      ? [
        ...nestedPaths.reduce((srcArr, fp) => [...srcArr, ..._getSources(fp, resolve, [])], []),
        srcAndPath
      ]
      : [srcAndPath]
  return [...srcs, ...acc]
}

export function getSources(filepath, resolve, acc = []) {
  return _getSources(filepath, resolve, acc)
    .filter((srcAndPath, index, array) => array
      .findIndex(item => item.path === srcAndPath.path) === index)
    .map(srcAndPath => srcAndPath.src)
}
