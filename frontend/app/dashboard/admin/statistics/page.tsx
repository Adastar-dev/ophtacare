"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts"
import { Users, Calendar, TrendingUp, Activity, Eye, Clock } from "lucide-react"

const appointmentsByMonth = [
  { month: "Jan", rdv: 145 },
  { month: "Fév", rdv: 132 },
  { month: "Mar", rdv: 168 },
  { month: "Avr", rdv: 154 },
  { month: "Mai", rdv: 189 },
  { month: "Juin", rdv: 176 }
]

const patientGrowth = [
  { month: "Jan", patients: 850 },
  { month: "Fév", patients: 892 },
  { month: "Mar", patients: 945 },
  { month: "Avr", patients: 1023 },
  { month: "Mai", patients: 1105 },
  { month: "Juin", patients: 1189 }
]

const consultationTypes = [
  { name: "Consultation générale", value: 35, color: "#0088D1" },
  { name: "Contrôle de vue", value: 25, color: "#00BFA5" },
  { name: "Fond d'oeil", value: 20, color: "#FF6B6B" },
  { name: "Chirurgie", value: 12, color: "#FFB347" },
  { name: "Urgences", value: 8, color: "#9B59B6" }
]

const doctorPerformance = [
  { name: "Dr. Laurent", consultations: 156, satisfaction: 98 },
  { name: "Dr. Dubois", consultations: 142, satisfaction: 96 },
  { name: "Dr. Moreau", consultations: 138, satisfaction: 97 },
  { name: "Dr. Bernard", consultations: 125, satisfaction: 95 }
]

export default function AdminStatisticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Statistiques</h1>
        <p className="text-muted-foreground mt-1">Analyse des performances et tendances</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Patients totaux</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,189</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+7.6%</span> depuis le mois dernier
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">RDV ce mois</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">176</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+12%</span> vs mois précédent
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux d&apos;occupation</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">87%</div>
            <Progress value={87} className="mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Satisfaction</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">96.5%</div>
            <p className="text-xs text-muted-foreground">
              Basé sur 423 avis
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="appointments" className="space-y-4">
        <TabsList>
          <TabsTrigger value="appointments">Rendez-vous</TabsTrigger>
          <TabsTrigger value="patients">Patients</TabsTrigger>
          <TabsTrigger value="consultations">Types de consultation</TabsTrigger>
          <TabsTrigger value="doctors">Performance médecins</TabsTrigger>
        </TabsList>

        <TabsContent value="appointments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Évolution des rendez-vous
              </CardTitle>
              <CardDescription>Nombre de rendez-vous par mois</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={appointmentsByMonth}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px"
                      }}
                    />
                    <Bar dataKey="rdv" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="patients" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Croissance du nombre de patients
              </CardTitle>
              <CardDescription>Évolution du nombre total de patients inscrits</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={patientGrowth}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px"
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="patients"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={{ fill: "hsl(var(--primary))" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="consultations" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-primary" />
                  Répartition des consultations
                </CardTitle>
                <CardDescription>Par type de consultation</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={consultationTypes}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {consultationTypes.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px"
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Détail par type</CardTitle>
                <CardDescription>Pourcentage des consultations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {consultationTypes.map((type) => (
                    <div key={type.name} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: type.color }}
                          />
                          <span>{type.name}</span>
                        </div>
                        <span className="font-medium">{type.value}%</span>
                      </div>
                      <Progress value={type.value} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="doctors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Performance des médecins
              </CardTitle>
              <CardDescription>Consultations et satisfaction ce mois</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {doctorPerformance.map((doctor) => (
                  <div key={doctor.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{doctor.name}</span>
                      <div className="flex items-center gap-4">
                        <Badge variant="secondary">
                          {doctor.consultations} consultations
                        </Badge>
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          {doctor.satisfaction}% satisfaction
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Progress
                        value={(doctor.consultations / 160) * 100}
                        className="flex-1 h-2"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
