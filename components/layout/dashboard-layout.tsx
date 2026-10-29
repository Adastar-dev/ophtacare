"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { useAuth } from '@/lib/auth-context'
import { useNotifications } from '@/hooks/use-notifications'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Eye,
  Home,
  Calendar,
  Users,
  FileText,
  Settings,
  LogOut,
  Stethoscope,
  Activity,
  UserPlus,
  Shield,
  History,
  Pill,
  ChevronLeft,
  ChevronRight,
  Bell,
  Menu,
  Sun,
  Moon,
  X,
} from 'lucide-react'

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
}

const navItems: Record<string, NavItem[]> = {
  patient: [
    { href: '/dashboard/patient', label: 'Accueil', icon: Home },
    { href: '/dashboard/patient/book', label: 'Prendre RDV', icon: Calendar },
    { href: '/dashboard/patient/appointments', label: 'Mes Rendez-vous', icon: Calendar },
    { href: '/dashboard/patient/medical-record', label: 'Dossier Médical', icon: FileText },
    { href: '/dashboard/patient/prescriptions', label: 'Ordonnances', icon: Pill },
    { href: '/dashboard/patient/profile', label: 'Mon assurance', icon: Shield },
  ],
  doctor: [
    { href: '/dashboard/doctor', label: 'Accueil', icon: Home },
    { href: '/dashboard/doctor/consultations', label: 'Consultations', icon: Stethoscope },
    { href: '/dashboard/doctor/patients', label: 'Patients', icon: Users },
    { href: '/dashboard/doctor/prescriptions', label: 'Ordonnances', icon: FileText },
    { href: '/dashboard/doctor/calendar', label: 'Calendrier', icon: Calendar },
  ],
  secretary: [
    { href: '/dashboard/secretary', label: 'Accueil', icon: Home },
    { href: '/dashboard/secretary/calendar', label: 'Calendrier', icon: Calendar },
    { href: '/dashboard/secretary/patients', label: 'Patients', icon: Users },
    { href: '/dashboard/secretary/new-patient', label: 'Nouveau Patient', icon: UserPlus },
  ],
  admin: [
    { href: '/dashboard/admin', label: 'Accueil', icon: Home },
    { href: '/dashboard/admin/users', label: 'Utilisateurs', icon: Users },
    { href: '/dashboard/admin/permissions', label: 'Permissions', icon: Shield },
    { href: '/dashboard/admin/logs', label: 'Logs Système', icon: History },
    { href: '/dashboard/admin/statistics', label: 'Statistiques', icon: Activity },
  ],
  caissier: [
    { href: '/dashboard/caissier', label: 'Caisse', icon: Home },
  ],
}

const roleLabels: Record<string, string> = {
  patient: 'Patient',
  doctor: 'Médecin',
  secretary: 'Secrétaire',
  admin: 'Administrateur',
  caissier: 'Caissier',
}

function initials(user: { firstName?: string; lastName?: string; email?: string }) {
  const f = user.firstName?.[0] || user.email?.[0] || '?'
  const l = user.lastName?.[0] || ''
  return `${f}${l}`.toUpperCase()
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { notifications, unreadCount, refresh: refreshNotifs } = useNotifications(user?.role ?? '')

  // Close mobile drawer on route change
  useEffect(() => { setMobileOpen(false) }, [pathname])

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (mobileOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  if (!user) return null

  const items = navItems[user.role] || []
  // Bottom nav shows first 5 items max
  const bottomItems = items.slice(0, 5)

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  const isActive = (href: string) => {
    if (href === `/dashboard/${user.role}`) return pathname === href
    return pathname.startsWith(href)
  }

  // Shared sidebar content
  const SidebarContent = ({ onNavClick }: { onNavClick?: () => void }) => (
    <>
      {/* Logo */}
      <div className={cn(
        'border-b border-sidebar-border flex items-center',
        collapsed ? 'p-3 justify-center' : 'p-5 justify-between'
      )}>
        {!collapsed && (
          <Link href={`/dashboard/${user.role}`} className="flex items-center gap-2.5 min-w-0" onClick={onNavClick}>
            <div className="p-1.5 bg-sidebar-primary/10 rounded-lg shrink-0">
              <Eye className="h-5 w-5 text-sidebar-primary" />
            </div>
            <span className="text-lg font-bold text-sidebar-foreground truncate">OphtaCare</span>
          </Link>
        )}
        {collapsed && (
          <Link href={`/dashboard/${user.role}`} onClick={onNavClick}>
            <div className="p-1.5 bg-sidebar-primary/10 rounded-lg">
              <Eye className="h-5 w-5 text-sidebar-primary" />
            </div>
          </Link>
        )}
        {!collapsed && (
          <button
            onClick={() => setCollapsed(true)}
            className="p-1.5 rounded-lg text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
      </div>

      {collapsed && (
        <button
          onClick={() => setCollapsed(false)}
          className="mx-auto mt-2 p-1.5 rounded-lg text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      )}

      {/* Navigation */}
      <nav className={cn('flex-1 space-y-1 overflow-y-auto', collapsed ? 'p-2' : 'p-3')}>
        {items.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)
          if (collapsed) {
            return (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>
                  <Link
                    href={item.href}
                    onClick={onNavClick}
                    className={cn(
                      'flex items-center justify-center p-3 rounded-lg transition-colors',
                      active
                        ? 'bg-sidebar-accent text-sidebar-primary'
                        : 'text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">{item.label}</TooltipContent>
              </Tooltip>
            )
          }
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavClick}
              className={cn(
                'flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors',
                active
                  ? 'bg-sidebar-accent text-sidebar-primary'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
              )}
            >
              <Icon className={cn('h-5 w-5 shrink-0', active ? 'text-sidebar-primary' : '')} />
              <span className="truncate">{item.label}</span>
              {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-sidebar-primary" />}
            </Link>
          )
        })}
      </nav>

      {/* User Menu */}
      <div className={cn('border-t border-sidebar-border', collapsed ? 'p-2' : 'p-3')}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            {collapsed ? (
              <button className="flex justify-center w-full p-1.5 rounded-lg hover:bg-sidebar-accent transition-colors">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-xs">
                    {initials(user)}
                  </AvatarFallback>
                </Avatar>
              </button>
            ) : (
              <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-sidebar-accent transition-colors text-left">
                <Avatar className="h-9 w-9 shrink-0">
                  <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-xs font-semibold">
                    {initials(user)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-sidebar-foreground truncate">{user.firstName} {user.lastName}</p>
                  <p className="text-xs text-sidebar-foreground/50 capitalize">{roleLabels[user.role]}</p>
                </div>
              </button>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side={collapsed ? 'right' : 'top'} className="w-56">
            <DropdownMenuLabel>
              <div>
                <p className="font-medium">{user.firstName} {user.lastName}</p>
                <p className="text-xs text-muted-foreground font-normal">{user.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />Paramètres
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />Déconnexion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  )

  return (
    <TooltipProvider delayDuration={0}>
      <div className="min-h-screen flex bg-background">

        {/* ── DESKTOP SIDEBAR (lg+) ── */}
        <aside className={cn(
          'hidden lg:flex bg-sidebar border-r border-sidebar-border flex-col transition-all duration-300 ease-in-out shrink-0',
          collapsed ? 'w-16' : 'w-64'
        )}>
          <SidebarContent />
        </aside>

        {/* ── MOBILE DRAWER OVERLAY ── */}
        {mobileOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}

        {/* ── MOBILE DRAWER ── */}
        <aside className={cn(
          'fixed inset-y-0 left-0 z-50 w-72 bg-sidebar border-r border-sidebar-border flex flex-col transition-transform duration-300 ease-in-out lg:hidden',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}>
          {/* Close button */}
          <button
            onClick={() => setMobileOpen(false)}
            className="absolute top-4 right-4 p-2 rounded-lg text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
          <SidebarContent onNavClick={() => setMobileOpen(false)} />
        </aside>

        {/* ── MAIN AREA ── */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Top Header */}
          <header className="h-14 border-b border-border bg-background/95 backdrop-blur-sm flex items-center justify-between px-4 md:px-6 shrink-0 sticky top-0 z-30">
            <div className="flex items-center gap-3">
              {/* Mobile hamburger */}
              <button
                onClick={() => setMobileOpen(true)}
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors lg:hidden"
                aria-label="Ouvrir le menu"
              >
                <Menu className="h-5 w-5" />
              </button>
              {/* Desktop collapse */}
              <button
                onClick={() => setCollapsed(!collapsed)}
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors hidden lg:flex"
                aria-label="Réduire la sidebar"
              >
                <Menu className="h-4 w-4" />
              </button>
              {/* Breadcrumb */}
              <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <span className="capitalize font-semibold text-foreground text-base md:text-sm">
                  {roleLabels[user.role]}
                </span>
                {pathname !== `/dashboard/${user.role}` && (
                  <>
                    <ChevronRight className="h-3.5 w-3.5 hidden sm:block" />
                    <span className="capitalize text-foreground/80 hidden sm:block">
                      {pathname.split('/').filter(Boolean).pop()?.replace(/-/g, ' ')}
                    </span>
                  </>
                )}
              </nav>
            </div>

            <div className="flex items-center gap-1 md:gap-2">
              {/* Dark mode */}
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="p-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                aria-label="Changer le thème"
              >
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>

              {/* Notifications */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="relative p-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full" />
                    )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80 max-w-[calc(100vw-2rem)]">
                  <DropdownMenuLabel className="flex items-center justify-between">
                    Notifications
                    {unreadCount > 0 && (
                      <Badge variant="secondary" className="text-xs">{unreadCount} nouvelle{unreadCount > 1 ? 's' : ''}</Badge>
                    )}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {notifications.length === 0 ? (
                    <div className="py-6 text-center text-sm text-muted-foreground">
                      Aucune notification
                    </div>
                  ) : (
                    notifications.map(notif => (
                      <DropdownMenuItem
                        key={notif.id}
                        className="flex flex-col items-start gap-0.5 py-3 cursor-pointer"
                        onSelect={() => { if (notif.href) router.push(notif.href) }}
                      >
                        <div className="flex items-center gap-2 w-full">
                          {notif.unread && <div className="w-2 h-2 rounded-full bg-primary shrink-0" />}
                          <span className={cn('text-sm leading-snug', notif.unread ? 'font-medium' : 'text-muted-foreground')}>
                            {notif.text}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground pl-4">{notif.time}</span>
                      </DropdownMenuItem>
                    ))
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* User avatar */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-lg hover:bg-secondary transition-colors">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                        {initials(user)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium hidden md:block">{user.firstName}</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div>
                      <p className="font-medium">{user.firstName} {user.lastName}</p>
                      <p className="text-xs text-muted-foreground font-normal">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />Paramètres
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />Déconnexion
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* Page Content — bottom padding on mobile for bottom nav */}
          <main className="flex-1 overflow-auto pb-20 lg:pb-0 [&>div]:px-4 [&>div]:py-4 [&>div]:md:px-6 [&>div]:md:py-6 [&>div]:lg:px-8 [&>div]:lg:py-8">
            {children}
          </main>
        </div>

        {/* ── MOBILE BOTTOM NAV ── */}
        <nav className="fixed bottom-0 inset-x-0 z-30 bg-background/95 backdrop-blur-sm border-t border-border lg:hidden safe-area-bottom">
          <div className="flex items-center justify-around h-16">
            {bottomItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex flex-col items-center justify-center gap-1 flex-1 h-full px-2 transition-colors',
                    active ? 'text-primary' : 'text-muted-foreground'
                  )}
                >
                  <div className={cn(
                    'p-1.5 rounded-xl transition-colors',
                    active ? 'bg-primary/10' : ''
                  )}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-[10px] font-medium leading-none truncate max-w-[56px] text-center">
                    {item.label}
                  </span>
                </Link>
              )
            })}
            {/* More button if > 4 items (shows drawer) */}
            {items.length > 5 && (
              <button
                onClick={() => setMobileOpen(true)}
                className="flex flex-col items-center justify-center gap-1 flex-1 h-full px-2 text-muted-foreground transition-colors"
              >
                <div className="p-1.5 rounded-xl">
                  <Menu className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-medium leading-none">Plus</span>
              </button>
            )}
          </div>
        </nav>

      </div>
    </TooltipProvider>
  )
}
