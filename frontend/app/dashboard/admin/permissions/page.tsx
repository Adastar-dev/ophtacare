"use client"

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Shield,
  Users,
  Stethoscope,
  ClipboardList,
  Eye,
  FileText,
  Calendar,
  Settings,
  Database,
  Save,
  CheckCircle,
} from 'lucide-react'

const roles = [
  {
    id: 'admin',
    label: 'Administrateur',
    icon: Shield,
    color: 'text-orange-600',
    bg: 'bg-orange-500/10',
    count: 1,
    description: 'Accès complet au système',
  },
  {
    id: 'doctor',
    label: 'Médecin',
    icon: Stethoscope,
    color: 'text-emerald-600',
    bg: 'bg-emerald-500/10',
    count: 8,
    description: 'Gestion patients et consultations',
  },
  {
    id: 'secretary',
    label: 'Secrétaire',
    icon: ClipboardList,
    color: 'text-violet-600',
    bg: 'bg-violet-500/10',
    count: 4,
    description: 'Planification et accueil',
  },
  {
    id: 'patient',
    label: 'Patient',
    icon: Users,
    color: 'text-blue-600',
    bg: 'bg-blue-500/10',
    count: 144,
    description: 'Accès à son propre dossier',
  },
]

type PermissionKey = 'view_patients' | 'edit_patients' | 'view_records' | 'edit_records' | 'manage_appointments' | 'view_reports' | 'manage_users' | 'system_settings'

const permissionModules: { key: PermissionKey; label: string; description: string; icon: React.ElementType }[] = [
  { key: 'view_patients', label: 'Voir les patients', description: 'Accès à la liste et fiche patient', icon: Users },
  { key: 'edit_patients', label: 'Modifier les patients', description: 'Créer et modifier des fiches patient', icon: FileText },
  { key: 'view_records', label: 'Voir les dossiers médicaux', description: 'Consultation des dossiers cliniques', icon: Eye },
  { key: 'edit_records', label: 'Modifier les dossiers', description: 'Rédiger consultations et ordonnances', icon: FileText },
  { key: 'manage_appointments', label: 'Gérer les rendez-vous', description: 'Créer, modifier et annuler des RDV', icon: Calendar },
  { key: 'view_reports', label: 'Voir les rapports', description: 'Accès aux statistiques et logs', icon: Database },
  { key: 'manage_users', label: 'Gérer les utilisateurs', description: 'Créer et désactiver des comptes', icon: Shield },
  { key: 'system_settings', label: 'Paramètres système', description: 'Configuration générale de la plateforme', icon: Settings },
]

type PermissionsMap = Record<string, Record<PermissionKey, boolean>>

const defaultPermissions: PermissionsMap = {
  admin: {
    view_patients: true,
    edit_patients: true,
    view_records: true,
    edit_records: true,
    manage_appointments: true,
    view_reports: true,
    manage_users: true,
    system_settings: true,
  },
  doctor: {
    view_patients: true,
    edit_patients: false,
    view_records: true,
    edit_records: true,
    manage_appointments: true,
    view_reports: false,
    manage_users: false,
    system_settings: false,
  },
  secretary: {
    view_patients: true,
    edit_patients: true,
    view_records: false,
    edit_records: false,
    manage_appointments: true,
    view_reports: false,
    manage_users: false,
    system_settings: false,
  },
  patient: {
    view_patients: false,
    edit_patients: false,
    view_records: true,
    edit_records: false,
    manage_appointments: false,
    view_reports: false,
    manage_users: false,
    system_settings: false,
  },
}

const recentUsers = [
  { id: '1', name: 'Dr. Jean Martin', role: 'doctor', email: 'j.martin@demo.com' },
  { id: '2', name: 'Sophie Bernard', role: 'secretary', email: 's.bernard@demo.com' },
  { id: '3', name: 'Dr. Claire Dubois', role: 'doctor', email: 'c.dubois@demo.com' },
]

export default function PermissionsPage() {
  const [selectedRole, setSelectedRole] = useState<string>('doctor')
  const [permissions, setPermissions] = useState<PermissionsMap>(defaultPermissions)
  const [saved, setSaved] = useState(false)

  const togglePermission = (perm: PermissionKey) => {
    if (selectedRole === 'admin') return
    setPermissions(prev => ({
      ...prev,
      [selectedRole]: {
        ...prev[selectedRole],
        [perm]: !prev[selectedRole][perm],
      }
    }))
    setSaved(false)
  }

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const currentPerms = permissions[selectedRole] || {}
  const enabledCount = Object.values(currentPerms).filter(Boolean).length
  const selectedRoleData = roles.find(r => r.id === selectedRole)

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestion des Permissions</h1>
          <p className="text-muted-foreground mt-1">
            Configurez les droits d&apos;accès par rôle utilisateur
          </p>
        </div>
        <Button onClick={handleSave} disabled={selectedRole === 'admin'} className="gap-2">
          {saved ? (
            <>
              <CheckCircle className="h-4 w-4 text-green-400" />
              Sauvegardé
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Sauvegarder
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Role selector */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide px-1">
            Rôles
          </h2>
          {roles.map((role) => {
            const Icon = role.icon
            const isSelected = selectedRole === role.id
            return (
              <button
                key={role.id}
                onClick={() => setSelectedRole(role.id)}
                className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-all ${
                  isSelected
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/40 hover:bg-secondary/50'
                }`}
              >
                <div className={`p-2 rounded-lg ${role.bg}`}>
                  <Icon className={`h-4 w-4 ${role.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{role.label}</p>
                  <p className="text-xs text-muted-foreground">{role.count} utilisateurs</p>
                </div>
                {isSelected && <div className="w-2 h-2 rounded-full bg-primary" />}
              </button>
            )
          })}

          {/* Role summary */}
          <Card className="mt-4">
            <CardContent className="pt-4 pb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{enabledCount}</div>
                <p className="text-xs text-muted-foreground">/ {permissionModules.length} permissions</p>
                <p className="text-sm font-medium mt-1 capitalize">{selectedRoleData?.label}</p>
              </div>
              <div className="w-full bg-secondary rounded-full h-2 mt-3">
                <div
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${(enabledCount / permissionModules.length) * 100}%` }}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Permissions matrix */}
        <div className="lg:col-span-3 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Permissions — {selectedRoleData?.label}
            </h2>
            {selectedRole === 'admin' && (
              <Badge variant="secondary" className="text-xs">
                Accès total non modifiable
              </Badge>
            )}
          </div>

          {permissionModules.map((perm) => {
            const Icon = perm.icon
            const isEnabled = currentPerms[perm.key] ?? false
            const isAdmin = selectedRole === 'admin'
            return (
              <div
                key={perm.key}
                className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                  isEnabled
                    ? 'bg-primary/3 border-primary/20'
                    : 'bg-card border-border hover:border-border/80'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg ${isEnabled ? 'bg-primary/10' : 'bg-secondary'}`}>
                    <Icon className={`h-4 w-4 ${isEnabled ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{perm.label}</p>
                    <p className="text-xs text-muted-foreground">{perm.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge
                    variant={isEnabled ? 'default' : 'outline'}
                    className={`text-xs ${isEnabled ? '' : 'text-muted-foreground'}`}
                  >
                    {isEnabled ? 'Autorisé' : 'Refusé'}
                  </Badge>
                  <Switch
                    checked={isEnabled}
                    onCheckedChange={() => togglePermission(perm.key)}
                    disabled={isAdmin}
                    className={isAdmin ? 'opacity-50 cursor-not-allowed' : ''}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Recent user activity */}
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Utilisateurs récents avec ce rôle</CardTitle>
            <CardDescription>
              {roles.find(r => r.id === selectedRole)?.description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 flex-wrap">
              {recentUsers
                .filter(u => u.role === selectedRole || (selectedRole === 'admin' && u.role === 'admin'))
                .concat(
                  recentUsers.filter(u => u.role !== selectedRole).slice(0, 2 - recentUsers.filter(u => u.role === selectedRole).length)
                )
                .slice(0, 3)
                .map(u => (
                  <div key={u.id} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 flex-1 min-w-[200px]">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {u.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{u.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
