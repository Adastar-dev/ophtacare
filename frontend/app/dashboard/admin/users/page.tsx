"use client"

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Search, Plus, MoreVertical, Edit, UserCheck, UserX, Filter, Loader2, AlertCircle,
} from 'lucide-react'
import { getAdminUsers, createUser, updateUser, type CreateUserPayload } from '@/lib/services'
import { ApiError } from '@/lib/api'
import type { BackendUser, BackendRole } from '@/lib/types'

const ROLE_LABELS: Record<string, string> = {
  medecin: 'Médecin', secretaire: 'Secrétaire', caissier: 'Caissier',
  admin_entite: 'Admin entité', super_admin: 'Super admin', patient: 'Patient',
}

function RoleBadge({ role }: { role: string }) {
  const colors: Record<string, string> = {
    medecin: 'bg-primary/10 text-primary',
    secretaire: 'bg-accent/10 text-accent',
    caissier: 'bg-yellow-500/10 text-yellow-600',
    admin_entite: 'bg-purple-500/10 text-purple-600',
    super_admin: 'bg-red-500/10 text-red-600',
    patient: 'bg-secondary text-secondary-foreground',
  }
  return <Badge className={colors[role] ?? ''}>{ROLE_LABELS[role] ?? role}</Badge>
}

const BLANK_FORM: CreateUserPayload = { name: '', email: '', password: '', role: 'secretaire' }

export default function AdminUsersPage() {
  const { user } = useAuth()
  const [users, setUsers] = useState<BackendUser[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<BackendUser | null>(null)
  const [form, setForm] = useState<CreateUserPayload>(BLANK_FORM)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const load = useCallback(() => {
    setLoading(true)
    getAdminUsers().then(setUsers).catch(() => {}).finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  if (!user) return null

  const filtered = users.filter((u) => {
    const matchSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchRole = roleFilter === 'all' || u.role === roleFilter
    return matchSearch && matchRole
  })

  const openNew = () => {
    setEditTarget(null)
    setForm(BLANK_FORM)
    setFormError('')
    setDialogOpen(true)
  }

  const openEdit = (u: BackendUser) => {
    setEditTarget(u)
    setForm({ name: u.name, email: u.email, password: '', role: u.role as CreateUserPayload['role'] })
    setFormError('')
    setDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true); setFormError('')
    try {
      if (editTarget) {
        const patch: Record<string, any> = { name: form.name, role: form.role }
        if (form.password) patch.password = form.password
        await updateUser(editTarget.id, patch)
      } else {
        await createUser(form)
      }
      setDialogOpen(false)
      load()
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Erreur lors de la sauvegarde.')
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (u: BackendUser) => {
    try {
      await updateUser(u.id, { is_active: !u.is_active })
      load()
    } catch {}
  }

  return (
    <div className="p-6 sm:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestion des utilisateurs</h1>
          <p className="text-muted-foreground mt-1">{users.length} utilisateurs enregistrés</p>
        </div>
        <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" />Nouvel utilisateur</Button>
      </div>

      {/* Dialog créer / modifier */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editTarget ? 'Modifier l\'utilisateur' : 'Créer un utilisateur'}</DialogTitle>
            <DialogDescription>Renseignez les informations du compte.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            {formError && (
              <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 p-3 rounded-lg">
                <AlertCircle className="h-4 w-4 shrink-0" />{formError}
              </div>
            )}
            <div className="space-y-2">
              <Label>Nom complet</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Jean Dupont" required />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="jean@clinique.sn" required disabled={!!editTarget} />
            </div>
            <div className="space-y-2">
              <Label>Rôle</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as CreateUserPayload['role'] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="medecin">Médecin</SelectItem>
                  <SelectItem value="secretaire">Secrétaire</SelectItem>
                  <SelectItem value="caissier">Caissier</SelectItem>
                  <SelectItem value="admin_entite">Admin entité</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{editTarget ? 'Nouveau mot de passe (optionnel)' : 'Mot de passe'}</Label>
              <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••••" required={!editTarget} />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
              <Button type="submit" disabled={saving}>
                {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sauvegarde…</> : (editTarget ? 'Mettre à jour' : 'Créer')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Filtres */}
      <Card>
        <CardContent className="pt-5 pb-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Rechercher…" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[160px]">
                <Filter className="mr-2 h-4 w-4" /><SelectValue placeholder="Rôle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les rôles</SelectItem>
                <SelectItem value="medecin">Médecin</SelectItem>
                <SelectItem value="secretaire">Secrétaire</SelectItem>
                <SelectItem value="caissier">Caissier</SelectItem>
                <SelectItem value="admin_entite">Admin entité</SelectItem>
                <SelectItem value="patient">Patient</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des utilisateurs</CardTitle>
          <CardDescription>Gérez les comptes du personnel et des patients</CardDescription>
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
                  <TableHead>Utilisateur</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rôle</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Créé le</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {(u.name ?? '?').slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <p className="font-medium">{u.name}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{u.email}</TableCell>
                    <TableCell><RoleBadge role={u.role} /></TableCell>
                    <TableCell>
                      {u.is_active === false
                        ? <Badge variant="secondary">Inactif</Badge>
                        : <Badge className="bg-green-500/10 text-green-600">Actif</Badge>}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {u.created_at ? new Date(u.created_at).toLocaleDateString('fr-FR') : '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm"><MoreVertical className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(u)}>
                            <Edit className="mr-2 h-4 w-4" />Modifier
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => toggleActive(u)} className={u.is_active === false ? 'text-green-600' : 'text-yellow-600'}>
                            {u.is_active === false
                              ? <><UserCheck className="mr-2 h-4 w-4" />Activer</>
                              : <><UserX className="mr-2 h-4 w-4" />Désactiver</>}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {!loading && filtered.length === 0 && (
            <p className="text-center py-8 text-muted-foreground text-sm">Aucun utilisateur trouvé.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
