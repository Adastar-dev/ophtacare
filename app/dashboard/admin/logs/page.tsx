"use client"

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { 
  Search,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getActivityLogs, getTransactionLogs } from '@/lib/services'

interface LogEntry {
  id: string | number
  timestamp?: string
  created_at?: string
  type?: string
  action?: string
  causer_email?: string
  user?: string
  details?: string
  description?: string
  severity?: string
  [key: string]: unknown
}

function normLog(raw: any, index: number): LogEntry {
  if (!raw || typeof raw !== 'object') {
    return { id: index, timestamp: '', type: 'data', action: String(raw ?? '—'), user: '—', details: '', severity: 'info' }
  }
  return {
    id: raw.id ?? index,
    timestamp: raw.created_at ?? raw.timestamp ?? raw.date ?? '',
    type: raw.type ?? raw.log_name ?? raw.category ?? 'data',
    action: raw.action ?? raw.event ?? raw.description ?? raw.message ?? '—',
    user: raw.causer_email ?? raw.user ?? raw.causer?.email ?? raw.user_email ?? '—',
    details: raw.details ?? raw.properties?.description ?? raw.properties?.attributes
      ? JSON.stringify(raw.properties?.attributes ?? {}).slice(0, 120)
      : (raw.subject_type ?? raw.model ?? ''),
    severity: raw.severity ?? raw.level ?? 'info',
  }
}

function safeExtractArray(value: any): any[] {
  if (!value) return []
  if (Array.isArray(value)) return value
  if (value && typeof value === 'object') {
    if (Array.isArray(value.data)) return value.data
    if (Array.isArray(value.logs)) return value.logs
    if (Array.isArray(value.items)) return value.items
    // Try first array-valued key
    for (const key of Object.keys(value)) {
      if (Array.isArray(value[key])) return value[key]
    }
  }
  return []
}

export default function AdminLogsPage() {
  const { user } = useAuth()
  const [activityLogs, setActivityLogs] = useState<LogEntry[]>([])
  const [transactionLogs, setTransactionLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [severityFilter, setSeverityFilter] = useState('all')

  useEffect(() => {
    Promise.allSettled([getActivityLogs(), getTransactionLogs()])
      .then(([act, trx]) => {
        const actData = act.status === 'fulfilled' ? safeExtractArray(act.value) : []
        const trxData = trx.status === 'fulfilled' ? safeExtractArray(trx.value) : []
        setActivityLogs(actData.map(normLog))
        setTransactionLogs(trxData.map(normLog))
      })
      .finally(() => setLoading(false))
  }, [])

  if (!user) return null

  const allLogs = [...activityLogs, ...transactionLogs].sort((a, b) =>
    (b.timestamp ?? '').localeCompare(a.timestamp ?? '')
  )

  const filter = (logs: LogEntry[]) =>
    logs.filter((log) => {
      const matchesSearch = `${log.action} ${log.user} ${log.details}`.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesSeverity = severityFilter === 'all' || log.severity === severityFilter
      return matchesSearch && matchesSeverity
    })

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'success':
        return <Badge className="bg-green-500/10 text-green-600"><CheckCircle className="mr-1 h-3 w-3" />Succès</Badge>
      case 'warning':
        return <Badge className="bg-yellow-500/10 text-yellow-600"><AlertTriangle className="mr-1 h-3 w-3" />Attention</Badge>
      case 'error':
        return <Badge variant="destructive"><XCircle className="mr-1 h-3 w-3" />Erreur</Badge>
      default:
        return <Badge variant="secondary">Info</Badge>
    }
  }

  const renderTable = (logs: LogEntry[]) => {
    const rows = filter(logs)
    return (
      <>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[180px]">Horodatage</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Utilisateur</TableHead>
              <TableHead className="max-w-[300px]">Détails</TableHead>
              <TableHead>Sévérité</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="font-mono text-sm text-muted-foreground">
                  {log.timestamp
                    ? new Date(log.timestamp).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })
                    : '—'}
                </TableCell>
                <TableCell className="font-mono text-sm">{log.action}</TableCell>
                <TableCell className="text-sm">{log.user}</TableCell>
                <TableCell className="max-w-[300px] truncate text-sm text-muted-foreground">{log.details}</TableCell>
                <TableCell>{getSeverityBadge(log.severity ?? 'info')}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {rows.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">Aucun log trouvé</div>
        )}
      </>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Logs Système</h1>
        <p className="text-muted-foreground mt-1">Historique des événements et actions du système</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg"><Activity className="h-5 w-5 text-primary" /></div>
              <div>
                <p className="text-2xl font-bold">{loading ? '…' : activityLogs.length}</p>
                <p className="text-xs text-muted-foreground">Logs d&apos;activité</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-500/10 rounded-lg"><AlertTriangle className="h-5 w-5 text-yellow-600" /></div>
              <div>
                <p className="text-2xl font-bold">{loading ? '…' : allLogs.filter(l => l.severity === 'warning').length}</p>
                <p className="text-xs text-muted-foreground">Avertissements</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg"><CheckCircle className="h-5 w-5 text-green-600" /></div>
              <div>
                <p className="text-2xl font-bold">{loading ? '…' : transactionLogs.length}</p>
                <p className="text-xs text-muted-foreground">Transactions</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Rechercher dans les logs…" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
            </div>
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Sévérité" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="success">Succès</SelectItem>
                <SelectItem value="warning">Attention</SelectItem>
                <SelectItem value="error">Erreur</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <Tabs defaultValue="all" className="w-full">
              <TabsList>
                <TabsTrigger value="all">Tous ({filter(allLogs).length})</TabsTrigger>
                <TabsTrigger value="activity">Activité ({filter(activityLogs).length})</TabsTrigger>
                <TabsTrigger value="transactions">Transactions ({filter(transactionLogs).length})</TabsTrigger>
              </TabsList>
              <TabsContent value="all" className="mt-4">{renderTable(allLogs)}</TabsContent>
              <TabsContent value="activity" className="mt-4">{renderTable(activityLogs)}</TabsContent>
              <TabsContent value="transactions" className="mt-4">{renderTable(transactionLogs)}</TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
