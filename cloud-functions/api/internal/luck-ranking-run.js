import { createRankingUpdateHandler } from '../../_shared/luck-ranking-handler.js'

const handle = createRankingUpdateHandler({ manual: true })

export async function onRequestPost(context) {
  return handle(context)
}
