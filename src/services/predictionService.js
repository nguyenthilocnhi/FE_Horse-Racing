import axios from 'axios'
import { API_BASE_URL } from '../constants/api'

const client = axios.create({ baseURL: API_BASE_URL })

export async function getPredictions() {
  const res = await client.get('/predictions')
  return res.data
}
