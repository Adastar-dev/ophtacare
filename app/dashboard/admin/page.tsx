"use client"

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Users, Shield, Activity, TrendingUp, Calendar, Database, Server, ChevronRight, Loader2,
} from 'lucide-react'
import Link from 'next/link'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import { getAdminDashboard, formatMontant, type AdminDashboard } from '@/lib/services'

const ROLE_COLORS: Record<string, string> = {
  medecin: '#10b981',
  secretaire: '#8b5cf6',
  caissier: '#f59e0b',
  admin_entite: '#3b82f6',
  super_admin: '#ef4444',
  patient: '#6b7280',
}

export default function AdminDashboard() {
  const { user } = useAuth()
  const [data, setData] = useState<AdminDashboard | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAdminDashboard()
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (!user) return null

  const statCards = data ? [
    { label: 'Patients enregistrés', value: data.stats.total_patients, icon: Users, sub: '' },
    { label: 'RDV aujourd\'hui', value: data.stats.rdv_aujourd_hui, icon: Calendar, sub: `${data.stats.rdv_confirmes} confirmés` },
    { label: 'Recette du mois', value: formatMontant(data.stats.recette_mois), icon: TrendingUp, sub: '' },
    { label: 'Services opérationnels', value: '100%', icon: Server, sub: 'Tous actifs' },
  ] : []

  const rdvParStatut = data
    ? Object.entries(data.rdv_par_statut).map(([name, value]) => ({ name, value }))
    : []

  const recetteSemaine = data?.recette_semaine.map((r) => ({
    date: new Date(r.date).toLocaleDateString('fr-FR', { weekday: 'short' }),
    total: parseFloat(r.total),
  })) ?? []

  return (
    <div className="p-6 sm:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Administration</h1>
        <p className="text-muted-foreground mt-1">Vue d&apos;ensemble du système</p>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground py-12 justify-center">
          <Loader2 className="h-5 w-5 animate-spin" /> Chargement…
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map((s) => (
              <Card key={s.label}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
                  <s.icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{s.value}</div>
                  {s.sub && <p className="text-xs text-muted-foreground">{s.sub}</p>}
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recette semaine */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Recette — 7 derniers jours</CardTitle>
                <CardDescription>Montants encaissés (F CFA)</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={recetteSemaine} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                    <Tooltip
                      contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', fontSize: 12 }}
                      formatter={(v: number) => [formatMontant(v), 'Recette']}
                      cursor={{ fill: 'hsl(var(--secondary))' }}
                    />
                    <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* RDV par statut */}
            <Card>
              <CardHeader>
                <CardTitle>RDV par statut</CardTitle>
                <CardDescription>Répartition globale</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={rdvParStatut} cx="50%" cy="50%" innerRadius={42} outerRadius={68} paddingAngle={3} dataKey="value">
                      {rdvParStatut.map((_, i) => (
                        <Cell key={i} fill={['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6'][i % 5]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', fontSize: 12 }} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Actions rapides */}
            <Card>
              <CardHeader><CardTitle>Actions rapides</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/dashboard/admin/users"><Users className="mr-2 h-4 w-4" />Gérer les utilisateurs</Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/dashboard/admin/logs"><Activity className="mr-2 h-4 w-4" />Logs d&apos;activité</Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/dashboard/admin/statistics"><Database className="mr-2 h-4 w-4" />Statistiques</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Logs récents */}
            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Transactions récentes</CardTitle>
                  <CardDescription>Paiements enregistrés</CardDescription>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/dashboard/admin/logs">Voir tout <ChevronRight className="ml-1 h-4 w-4" /></Link>
                </Button>
              </CardHeader>
              <CardContent>
                {data?.recette_semaine?.length ? (
                  <div className="space-y-2">
                    {data.recette_semaine.slice(-5).map((r, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary/50 transition-colors text-sm">
                        <span className="text-muted-foreground">{new Date(r.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'short' })}</span>
                        <Badge variant="secondary">{formatMontant(parseFloat(r.total))}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">Aucune transaction cette semaine.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
