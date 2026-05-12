'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase/client'
import { toast } from 'sonner'
import { getCurrentUser } from '../actions/users'
import { getRoleLabel } from '../../lib/roles'

// Define menu items with required roles
const menuItems = [
  { name: 'لوحة التحكم', href: '/', icon: '🏠', allowedRoles: ['admin', 'manager', 'teacher'] },
  { name: 'الغيابات', href: '/attendance', icon: '📝', allowedRoles: ['admin', 'manager', 'teacher'] },
  { name: 'التلاميذ', href: '/students', icon: '👨‍🎓', allowedRoles: ['admin', 'manager', 'teacher'] },
  { name: 'الأقسام', href: '/classes', icon: '📚', allowedRoles: ['admin', 'manager', 'teacher'] },
  { name: 'العقوبات', href: '/sanctions', icon: '⚠️', allowedRoles: ['admin', 'manager', 'teacher'] },
  { name: 'التقارير', href: '/reports', icon: '📊', allowedRoles: ['admin', 'manager'] },
  { name: 'رفع قائمات التلاميذ', href: '/upload', icon: '📤', allowedRoles: ['admin', 'manager'] }
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [user, setUser] = useState(null)
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { user, authUser, error } = await getCurrentUser()
        
        if (error || !user) {
          console.error('No user found', error)
          setLoading(false)
          return
        }

        setUserData(user)
        setUser(authUser || { id: user.user_id })
      } catch (error) {
        console.error('Error fetching user:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        fetchUser()
      } else {
        setUser(null)
        setUserData(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        toast.error('حدث خطأ في تسجيل الخروج')
      } else {
        toast.success('تم تسجيل الخروج بنجاح')
        router.push('/login')
        router.refresh()
      }
    } catch (error) {
      console.error('Logout error:', error)
      toast.error('حدث خطأ في تسجيل الخروج')
    }
  }

  const handleProfileClick = () => {
    router.push('/profile')
  }

  const getFullName = () => {
    if (!userData) return 'مستخدم'
    if (userData.nom && userData.prenom) {
      return `${userData.nom} ${userData.prenom}`.trim()
    }
    if (userData.nom) return userData.nom
    if (userData.prenom) return userData.prenom
    return 'مستخدم'
  }

  // Filter menu items based on user role
  const getFilteredMenuItems = () => {
    if (!userData?.role) return menuItems.filter(item => item.allowedRoles.includes('teacher'))
    return menuItems.filter(item => item.allowedRoles.includes(userData.role))
  }

  const filteredMenuItems = getFilteredMenuItems()

  return (
    <>
      {/* Desktop Sidebar - on the RIGHT side for Arabic */}
      <aside 
        className={`hidden md:block fixed right-0 top-0 h-full bg-gradient-to-b from-blue-900 to-blue-800 text-white transition-all duration-300 z-20 ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between p-4 border-b border-blue-700">
          {!isCollapsed && (
            <div className="flex items-center space-x-2 space-x-reverse">
              <span className="text-2xl">🏫</span>
              <span className="font-bold text-lg">معهد عبدالحميد غزواني</span>
            </div>
          )}
          {isCollapsed && <span className="text-2xl mx-auto">🏫</span>}
          
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-white hover:text-blue-200 transition-colors"
          >
            {isCollapsed ? '←' : '→'}
          </button>
        </div>

        {/* Navigation */}
        <nav className="mt-6 overflow-y-auto" style={{ height: 'calc(100% - 180px)' }}>
          {filteredMenuItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center space-x-3 px-4 py-3 mx-2 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-700 text-white shadow-lg'
                    : 'text-blue-100 hover:bg-blue-800 hover:text-white'
                } ${isCollapsed ? 'justify-center' : ''}`}
              >
                <span className="text-xl">{item.icon}</span>
                {!isCollapsed && <span className="font-medium">{item.name}</span>}
              </Link>
            )
          })}
        </nav>

        {/* Bottom section - User Info & Logout */}
        <div className="absolute bottom-0 w-full p-4 border-t border-blue-700 bg-gradient-to-b from-blue-900 to-blue-800">
          {loading ? (
            <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'}`}>
              <div className="w-8 h-8 bg-blue-600 rounded-full animate-pulse"></div>
              {!isCollapsed && (
                <div className="flex-1">
                  <div className="h-4 bg-blue-700 rounded animate-pulse w-24 mb-2"></div>
                  <div className="h-3 bg-blue-700 rounded animate-pulse w-32"></div>
                </div>
              )}
            </div>
          ) : user ? (
            <div>
              <div 
                onClick={handleProfileClick}
                className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} mb-3 cursor-pointer hover:bg-blue-800 rounded-lg p-2 transition-colors`}
              >
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white shadow-lg flex-shrink-0">
                  <span className="text-lg">{getFullName().charAt(0) || '👤'}</span>
                </div>
                {!isCollapsed && (
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{getFullName()}</p>
                    <p className="text-xs text-blue-200 truncate">{userData?.email || user?.email}</p>
                    {userData?.role && (
                      <p className="text-xs text-blue-300 mt-1">{getRoleLabel(userData.role)}</p>
                    )}
                  </div>
                )}
              </div>
              {!isCollapsed && (
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-all duration-200 text-sm font-medium"
                >
                  <span>🚪</span>
                  <span>تسجيل الخروج</span>
                </button>
              )}
              {isCollapsed && (
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center px-3 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-all duration-200"
                  title="تسجيل الخروج"
                >
                  <span>🚪</span>
                </button>
              )}
            </div>
          ) : (
            <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'}`}>
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                👤
              </div>
              {!isCollapsed && (
                <>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">زائر</p>
                    <p className="text-xs text-blue-200 truncate">غير مسجل الدخول</p>
                  </div>
                  <Link
                    href="/login"
                    className="text-blue-200 hover:text-white flex-shrink-0"
                  >
                    🔑
                  </Link>
                </>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t border-gray-200 z-20">
        <div className="flex justify-around py-2">
          {filteredMenuItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
                  isActive
                    ? 'text-blue-600'
                    : 'text-gray-600 hover:text-blue-600'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="text-xs mt-1">{item.name}</span>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Spacer for mobile bottom nav */}
      <div className="md:hidden h-16"></div>
    </>
  )
}