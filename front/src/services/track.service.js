import { httpService } from './http.service'

export const trackService = {
  getById,
  upsert,
}

async function getById(id) {
  try {
    const res = await httpService.getSilent(`track/${id}`)
    return res
  } catch (err) {
    if (err?.response?.status === 404) return null
    throw err
  }
}

async function upsert(track) {
  return await httpService.post('track', track)
}
