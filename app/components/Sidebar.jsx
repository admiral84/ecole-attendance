'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase/client'
import { toast } from 'sonner'

const menuItems = [
  { name: 'لوحة التحكم', href: '/', icon: '🏠' },
  { name: 'تسجيل الغيابات', href: '/attendance', icon: '📝' },
  { name: 'التلاميذ', href: '/students', icon: '👨‍🎓' },
  { name: 'الأقسام', href: '/classes', icon: '📚' },
  { name: 'العقوبات', href: '/sanctions', icon: '⚠️' },
  { name: 'التقارير', href: '/reports', icon: '📊' },
  { name: 'رفع قائمات التلاميذ', href: '/upload', icon: '📤' }
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [user, setUser] = useState(null)
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getUser = async () => {
      try {
        // Get current user from Auth
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
        
        if (authError || !authUser) {
          console.error('No user found', authError)
          setLoading(false)
          return
        }

        setUser(authUser)
        
      

        // Try to get user data from users table using different methods
        let userInfo = null
        let userError = null

        // Method 1: Try by matricule from metadata
        const matricule = authUser.user_metadata?.matricule
        if (matricule) {
          const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('matricule', matricule)
            .single()
          
          if (!error && data) {
            userInfo = data
          } else {
            userError = error
          }
        }

        // Method 2: If not found, try to get user data from metadata only
        if (!userInfo) {
          
          setUserData({
            nom: authUser.user_metadata?.nom || 'مستخدم',
            prenom: authUser.user_metadata?.prenom || '',
            role: authUser.user_metadata?.role || 'teacher',
            email: authUser.email,
            matricule: authUser.user_metadata?.matricule || 'N/A',
            phone: authUser.user_metadata?.phone || ''
          })
        } else {
          
          setUserData({
            nom: userInfo.nom,
            prenom: userInfo.prenom,
            role: userInfo.role,
            email: authUser.email,
            matricule: userInfo.matricule,
            phone: userInfo.phone
          })
        }
      } catch (error) {
        console.error('Error fetching user:', error)
      } finally {
        setLoading(false)
      }
    }

    getUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        getUser()
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

  const getRoleLabel = (role) => {
    switch(role) {
      case 'admin': return 'مدير'
      case 'teacher': return 'أستاذ'
      case 'manager': return 'إداري'
      default: return 'مستخدم'
    }
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
            <div className="flex items-center space-x-2">
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
        <nav className="mt-6">
          {menuItems.map((item) => {
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
        <div className="absolute bottom-0 w-full p-4 border-t border-blue-700">
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
              <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} mb-3`}>
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white shadow-lg">
                  <span className="text-lg">{getFullName().charAt(0) || '👤'}</span>
                </div>
                {!isCollapsed && (
                  <div className="flex-1">
                    <p className="text-sm font-medium truncate">{getFullName()}</p>
                    <p className="text-xs text-blue-200 truncate">{userData?.email || user?.email}</p>
                    
                  
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
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                👤
              </div>
              {!isCollapsed && (
                <>
                  <div className="flex-1">
                    <p className="text-sm font-medium">زائر</p>
                    <p className="text-xs text-blue-200">غير مسجل الدخول</p>
                  </div>
                  <Link
                    href="/login"
                    className="text-blue-200 hover:text-white"
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
          {menuItems.map((item) => {
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