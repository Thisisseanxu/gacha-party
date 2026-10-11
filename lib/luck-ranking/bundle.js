import { createHash } from 'node:crypto'
import { gzipSync } from 'node:zlib'
import {
  BUNDLE_DATA_TYPE,
  BUNDLE_SCHEMA_VERSION,
  normalizeLuckRankingBundle,
} from '../../src/utils/luckRankingData.js'

export function encodeRankingBundle({ index, details }) {
  const bundle = {
    dataType: BUNDLE_DATA_TYPE,
    schemaVersion: BUNDLE_SCHEMA_VERSION,
    index,
    details,
  }
  normalizeLuckRankingBundle(bundle)
  const body = gzipSync(JSON.stringify(bundle), { level: 9 })
  const etag = `"luck-${createHash('sha256').update(body).digest('hex')}"`
  return { body, etag }
}

export function matchesRankingEtag(ifNoneMatch, etag) {
  return (
    typeof ifNoneMatch === 'string' &&
    ifNoneMatch.split(',').some((value) => {
      const tag = value.trim().replace(/^W\//, '')
      return tag === '*' || tag === etag
    })
  )
}
