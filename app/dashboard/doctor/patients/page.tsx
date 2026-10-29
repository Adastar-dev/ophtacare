"use client"

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Search, Eye, Loader2 } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import Link from 'next/link'
import { getPatients } from '@/lib/services'
import type { BackendPatient } from '@/lib/types'

function calcAge(dob: string): number {
  const today = new Date()
  const birth = new Date(dob)
  let age = today.getFullYear() - birth.getFullYear()
  if (today.getMonth() < birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) age--
  return age
}

export default function DoctorPatientsPage() {
  const { user } = useAuth()
  const [patients, setPatients] = useState<BackendPatient[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    getPatients().then(setPatients).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (!user) return null

  const filtered = patients.filter((p) => {
    const name = `${p.prenom} ${p.nom}`.toLowerCase()
    return name.includes(search.toLowerCase()) || p.telephone.includes(search)
  })

  return (
    <div className="p-6 sm:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Mes Patients</h1>
        <p className="text-muted-foreground mt-1">{patients.length} patients enregistrés</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Rechercher par nom ou téléphone…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des patients</CardTitle>
          <CardDescription>Patients enregistrés dans la clinique</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 justify-center py-10 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" /> Chargement…
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Âge</TableHead>
                  <TableHead>Téléphone</TableHead>
                  <TableHead>Assurance</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {(p.prenom?.[0] ?? '?')}{(p.nom?.[0] ?? '')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{p.prenom} {p.nom}</p>
                          <p className="text-xs text-muted-foreground">{p.code_patient}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{p.date_naissance ? calcAge(p.date_naissance) + ' ans' : '—'}</TableCell>
                    <TableCell className="text-sm">{p.telephone}</TableCell>
                    <TableCell>
                      {p.assureur
                        ? <Badge className="bg-blue-500/10 text-blue-600">{p.assureur}</Badge>
                        : <span className="text-xs text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/dashboard/doctor/patients/${p.id}`}>
                            <Eye className="mr-1.5 h-4 w-4" />Dossier
                          </Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/dashboard/doctor/consultations/new?patient_id=${p.id}`}>
                            Nouvelle consultation
                          </Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {!loading && filtered.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">Aucun patient trouvé.</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
