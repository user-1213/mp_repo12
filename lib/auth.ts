import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import type { JWTPayload } from './types'

const JWT_SECRET = process.env.JWT_SECRET || 'it-support-platform-secret-key-2024'

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10)
}

export function verifyPassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash)
}

export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' })
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload
  } catch {
    return null
  }
}

export function getTokenFromHeaders(headers: Headers): string | null {
  const auth = headers.get('authorization')
  if (!auth) return null
  const parts = auth.split(' ')
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null
  return parts[1]
}

export function getUserFromHeaders(headers: Headers): JWTPayload | null {
  const token = getTokenFromHeaders(headers)
  if (!token) return null
  return verifyToken(token)
}
