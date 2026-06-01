import axios from 'axios'
import { API_BASE_URL } from '../constants/api'

const client = axios.create({ baseURL: API_BASE_URL })

export async function getHorses() {
  const res = await client.get('/horses')
  return res.data
}

export async function getHorse(id) {
  const res = await client.get(`/horses/${id}`)
  return res.data
}

export async function createHorse(payload) {
  const res = await client.post('/horses', payload)
  return res.data
}
