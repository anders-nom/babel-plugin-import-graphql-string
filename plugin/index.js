import { delimiter, join } from 'path'
import { existsSync } from 'fs'

import { requireGql, defaultResolve } from './requireGql'

let resolve

export default ({ types: t, template }) => ({
  manipulateOptions({ resolveModuleSource, plugins }) {
    resolve = resolveModuleSource || defaultResolve
  },
  visitor: {
    ImportDeclaration: {
      exit(curPath, { opts, file }) {
        const importPath = curPath.node.source.value
        const jsFilename = file.opts.filename
        let { extensions = [] } = opts

        extensions = [...extensions, '.graphql', '.gql']

        if (extensions.some(extension => importPath.endsWith(extension))) {
          // Find the file, using node resolution/NODE_PATH if necessary.
          const fallbackPaths = opts.nodePath
            ? opts.nodePath.split(delimiter)
            : [process.env.NODE_PATH]
          let absPath = resolve(importPath, jsFilename)
          if (!existsSync(absPath)) {
            absPath = fallbackPaths
              .map(fallbackPath => join(fallbackPath, importPath))
              .find(altPath => existsSync(altPath))
          }

          // Analyze the file, returning one of the following...
          // For schema-like files: string - the GraphQL source code
          // For op/frag files: object - map of names to GraphQL Documents
          const result = requireGql(absPath, {
            resolve,
            nowrap: false,
          })

          const importNames = curPath.node.specifiers
          curPath.replaceWith(buildSrcVarNode(result, importNames[0].local.name))
        }

        function buildSrcVarNode(graphqlSrc, importName) {
          const buildNode = template('var IMPORT_NAME = SOURCE;', { sourceType: 'module' })
          return buildNode({
            IMPORT_NAME: t.identifier(importName),
            SOURCE: t.stringLiteral(graphqlSrc)
          })
        }
      }
    }
  }
})
