import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const RESOLVED_PREFIX = '\0'

const DATA_MODULES = {
  'virtual:gacha-party-card-pools': 'card_pools_full.json',
  'virtual:gacha-party-huizhang': 'huizhang.json',
}

export function publicJsonDataPlugin(root) {
  const moduleFiles = new Map(
    Object.entries(DATA_MODULES).map(([moduleId, filename]) => [
      `${RESOLVED_PREFIX}${moduleId}`,
      resolve(root, 'public/data', filename),
    ]),
  )

  return {
    name: 'public-json-data',

    resolveId(id) {
      return Object.prototype.hasOwnProperty.call(DATA_MODULES, id)
        ? `${RESOLVED_PREFIX}${id}`
        : null
    },

    load(id) {
      const file = moduleFiles.get(id)
      if (!file) return null

      this.addWatchFile(file)
      const data = JSON.parse(readFileSync(file, 'utf8'))
      return `export default ${JSON.stringify(data)}`
    },

    handleHotUpdate({ file, server }) {
      const resolvedFile = resolve(file)
      for (const [moduleId, dataFile] of moduleFiles) {
        if (resolvedFile !== dataFile) continue

        const module = server.moduleGraph.getModuleById(moduleId)
        if (module) server.moduleGraph.invalidateModule(module)
        server.ws.send({ type: 'full-reload' })
        return []
      }
    },
  }
}
