'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { 
  Home, 
  Search, 
  Bell, 
  PlusSquare, 
  User, 
  MessageCircle,
  Settings,
  Menu,
  X,
  Shield
} from 'lucide-react'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { NotificationBell } from './NotificationBell'

interface ModernLayoutProps {
  children: React.ReactNode
  user?: SupabaseUser | null
  onLogout?: () => void
}

export function ModernLayout({ children, user, onLogout }: ModernLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  const navItems = [
    { href: '/', icon: Home, label: 'Home', active: pathname === '/' },
    { href: '/discover', icon: Search, label: 'Discover', active: pathname === '/discover' },
    { href: '/create', icon: PlusSquare, label: 'Create', active: pathname === '/create' },
    { href: `/users/${user?.id}`, icon: User, label: 'Profile', active: pathname === `/users/${user?.id}` },
  ]

  if (user?.user_metadata?.is_admin) {
    navItems.push({ href: '/admin', icon: Shield, label: 'Admin', active: pathname === '/admin' })
  }

  const NavItem = ({ href, icon: Icon, label, active }: { 
    href: string, 
    icon: React.ComponentType<{ className?: string }>, 
    label: string, 
    active: boolean 
  }) => (
    <Link href={href} className={`flex items-center space-x-3 px-3 py-2 rounded-xl transition-all duration-200 group ${
      active 
        ? 'bg-gray-900 text-white shadow-lg' 
        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
    }`}>
      <Icon className={`w-6 h-6 ${active ? 'text-white' : 'group-hover:scale-110 transition-transform'}`} />
      <span className={`font-medium ${active ? 'text-white' : ''}`}>{label}</span>
    </Link>
  )

  const NotificationNavItem = () => (
    <Link href="/notifications" className={`flex items-center space-x-3 px-3 py-2 rounded-xl transition-all duration-200 group ${
      pathname === '/notifications'
        ? 'bg-gray-900 text-white shadow-lg' 
        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
    }`}>
      <div className="relative">
        <Bell className={`w-6 h-6 ${pathname === '/notifications' ? 'text-white' : 'group-hover:scale-110 transition-transform'}`} />
        <NotificationBell 
          userId={user?.id} 
          className="absolute -top-1 -right-1"
        />
      </div>
      <span className={`font-medium ${pathname === '/notifications' ? 'text-white' : ''}`}>
        Notifications
      </span>
    </Link>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200 pt-5 pb-4 overflow-y-auto shadow-sm">
          {/* Logo */}
          <div className="flex items-center flex-shrink-0 px-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-500 rounded-lg flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">SocialConnect</h1>
            </div>
          </div>

          {/* Navigation */}
          <nav className="mt-8 flex-1 px-4 space-y-2">
            {navItems.map((item) => (
              <NavItem key={item.href} {...item} />
            ))}
            <NotificationNavItem />
          </nav>

          {/* User Profile & Logout */}
          {user && (
            <div className="flex-shrink-0 px-4 pb-4">
              <div className="flex items-center space-x-3 p-3 rounded-xl bg-gray-50 border">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user.user_metadata?.avatar_url} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                    {user.email?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user.user_metadata?.username || user.email}
                  </p>
                  <p className="text-xs text-gray-500">Online</p>
                </div>
                <Button
                  onClick={onLogout}
                  variant="ghost"
                  size="sm"
                  className="text-gray-500 hover:text-red-600"
                >
                  <Settings className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Header */}
      <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-500 rounded-lg flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">SocialConnect</h1>
        </div>
        
        <div className="flex items-center space-x-3">
          {user && (
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.user_metadata?.avatar_url} />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm">
                {user.email?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 space-y-2">
          {navItems.map((item) => (
            <NavItem key={item.href} {...item} />
          ))}
          {user && (
            <Button
              onClick={onLogout}
              variant="ghost"
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              Sign Out
            </Button>
          )}
        </div>
      )}

      {/* Main Content */}
      <div className="lg:pl-64">
        <main className="flex-1">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2">
        <div className="flex items-center justify-around">
          {navItems.slice(0, 5).map((item) => (
            <Link key={item.href} href={item.href} className={`p-2 rounded-lg ${
              item.active ? 'text-blue-600' : 'text-gray-500'
            }`}>
              <item.icon className="w-6 h-6" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
