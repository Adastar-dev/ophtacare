"use client"

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { getPatients } from '@/lib/services'
import type { BackendPatient } from '@/lib/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useRouter } from 'next/navigation'
import { 
  Search, 
  Plus, 
  Phone, 
  Mail, 
  Calendar,
  FileText,
  MoreVertical,
  Eye
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export default function SecretaryPatientsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [patients, setPatients] = useState<BackendPatient[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPatient, setSelectedPatient] = useState<BackendPatient | null>(null)

  useEffect(() => {
    getPatients().then(setPatients).catch(() => setPatients([])).finally(() => setLoading(false))
  }, [])

  if (!user) return null

  const filteredPatients = patients.filter(patient => {
    const fullName = `${patient.prenom} ${patient.nom}`.toLowerCase()
    const query = searchQuery.toLowerCase()
    return fullName.includes(query) ||
           (patient.email || '').toLowerCase().includes(query) ||
           (patient.telephone || '').includes(query) ||
           patient.code_patient.toLowerCase().includes(query)
  })

  const calculateAge = (dateOfBirth: string | null | undefined): string => {
    if (!dateOfBirth) return '—'
    const today = new Date()
    const birthDate = new Date(dateOfBirth)
    if (isNaN(birthDate.getTime())) return '—'
    let age = today.getFullYear() - birthDate.getFullYear()
    const m = today.getMonth() - birthDate.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return `${age} ans`
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Gestion des Patients
          </h1>
          <p className="text-muted-foreground mt-1">
            {patients.length} patients enregistrés
          </p>
        </div>
        <Button asChild>
          <a href="/dashboard/secretary/new-patient">
            <Plus className="mr-2 h-4 w-4" />
            Nouveau Patient
          </a>
        </Button>
      </div>

      {/* Search */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom, email, téléphone ou numéro de dossier..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Patients Table */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des Patients</CardTitle>
          <CardDescription>
            Cliquez sur un patient pour voir ses détails
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Code patient</TableHead>
                <TableHead>Assureur</TableHead>
                <TableHead>Couverture</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPatients.map((patient) => (
                <TableRow key={patient.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell>
                    <div>
                      <p className="font-medium">{patient.prenom} {patient.nom}</p>
                      <p className="text-sm text-muted-foreground">
                        {calculateAge(patient.date_naissance)}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-3 w-3 text-muted-foreground" />
                        {patient.telephone}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        {patient.email || '—'}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{patient.code_patient}</Badge>
                  </TableCell>
                  <TableCell>
                    {patient.assureur ? (
                      <Badge className="bg-primary/10 text-primary">{patient.assureur}</Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {patient.taux_couverture != null ? `${patient.taux_couverture}%` : <span className="text-muted-foreground text-sm">—</span>}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={(e) => {
                          e.preventDefault()
                          setSelectedPatient(patient)
                        }}>
                          <Eye className="mr-2 h-4 w-4" />
                          Voir détails
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => router.push(`/dashboard/secretary/patients/${patient.id}/rdv`)}>
                          <Calendar className="mr-2 h-4 w-4" />
                          Prendre RDV
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => router.push(`/dashboard/doctor/patients/${patient.id}`)}>
                          <FileText className="mr-2 h-4 w-4" />
                          Dossier médical
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredPatients.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Aucun patient trouvé pour cette recherche
            </div>
          )}
        </CardContent>
      </Card>

      {/* Patient Details Dialog */}
      <Dialog open={!!selectedPatient} onOpenChange={() => setSelectedPatient(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Détails du Patient</DialogTitle>
            <DialogDescription>
              Informations complètes du patient
            </DialogDescription>
          </DialogHeader>
          {selectedPatient && (
            <div className="space-y-6 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Nom complet</Label>
                  <p className="font-medium">{selectedPatient.prenom} {selectedPatient.nom}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Date de naissance</Label>
                  <p className="font-medium">
                    {new Date(selectedPatient.date_naissance).toLocaleDateString('fr-FR')} ({calculateAge(selectedPatient.date_naissance)})
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Téléphone</Label>
                  <p className="font-medium">{selectedPatient.telephone}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Email</Label>
                  <p className="font-medium">{selectedPatient.email || '—'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Code patient</Label>
                  <p className="font-medium">{selectedPatient.code_patient}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Assurance</Label>
                  <p className="font-medium">
                    {selectedPatient.assureur
                      ? `${selectedPatient.assureur}${selectedPatient.taux_couverture != null ? ` (${selectedPatient.taux_couverture}%)` : ''}`
                      : 'Aucune'}
                  </p>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <Button className="flex-1">
                  <Calendar className="mr-2 h-4 w-4" />
                  Prendre RDV
                </Button>
                <Button variant="outline" className="flex-1">
                  <FileText className="mr-2 h-4 w-4" />
                  Dossier médical
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
