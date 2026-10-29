"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { User, UserRole } from '@/lib/types'
import { normalizeRole } from '@/lib/types'
import { api, setToken, clearToken, getToken } from '@/lib/api'

export interface RegisterPayload {
  nom: string
  prenom: string
  email: string
  password: string
  telephone: string
  date_naissance: string
  genre: 'M' | 'F'
  clinique_id?: number
  assureur?: string
  numero_assurance?: string
  taux_couverture?: number
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string, expectedRole?: UserRole) => Promise<User>
  register: (payload: RegisterPayload) => Promise<User>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Convertit l'utilisateur renvoyé par le backend en User front normalisé
function mapUser(raw: any): User {
  const parts = (raw?.name || '').trim().split(' ')
  return {
    id: raw.id,
    email: raw.email,
    name: raw.name,
    firstName: parts[0] || raw.email,
    lastName: parts.slice(1).join(' ') || '',
    backendRole: raw.role,
    role: normalizeRole(raw.role),
    clinique_id: raw.clinique_id ?? null,
    patient_id: raw.patient_id ?? null,
    patient: raw.patient ?? null,
    createdAt: raw.created_at,
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Au montage : si un token existe, on récupère l'utilisateur courant
  useEffect(() => {
    const token = getToken()
    if (!token) {
      setIsLoading(false)
      return
    }
    api
      .get('/user')
      .then((raw) => setUser(mapUser(raw)))
      .catch(() => {
        clearToken()
        setUser(null)
      })
      .finally(() => setIsLoading(false))
  }, [])

  const login = async (email: string, password: string, expectedRole?: UserRole): Promise<User> => {
    const res = await api.post('/login', { email, password }, false)
    const mapped = mapUser(res.user)

    if (expectedRole && mapped.role !== expectedRole) {
      throw new Error("Ce compte n'est pas autorisé pour ce profil de connexion.")
    }

    setToken(res.access_token)
    setUser(mapped)
    return mapped
  }

  const register = async (payload: RegisterPayload): Promise<User> => {
    const res = await api.post('/register', payload, false)
    setToken(res.access_token)
    const mapped = mapUser(res.user)
    setUser(mapped)
    return mapped
  }

  const refreshUser = async () => {
    const raw = await api.get('/user')
    setUser(mapUser(raw))
  }

  const logout = () => {
    // On tente de révoquer le token côté serveur sans bloquer l'UI
    api.post('/logout').catch(() => {})
    clearToken()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
