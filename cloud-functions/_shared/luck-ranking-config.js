import { createHash } from 'node:crypto'
import rawPools from '../../public/data/gacha_pools.json' with { type: 'json' }
import fullPools from '../../public/data/card_pools_full.json' with { type: 'json' }
import cards from '../../public/data/cards.json' with { type: 'json' }

export const rankingConfig = [rawPools, fullPools, cards]
// Bump the engine version if its checkpoint representation or ranking rules change.
export const configVersion = createHash('sha256')
  .update(JSON.stringify([1, ...rankingConfig]))
  .digest('hex')
  .slice(0, 24)
