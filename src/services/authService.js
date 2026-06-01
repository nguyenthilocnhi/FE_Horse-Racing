import axios from 'axios'
import { API_BASE_URL } from '../constants/api'

const client = axios.create({ baseURL: API_BASE_URL })

export async function login(credentials) {
  const res = await client.post('/auth/login', credentials)
  return res.data
}

export async function register(payload) {
  const res = await client.post('/auth/register', payload)
  return res.data
}
