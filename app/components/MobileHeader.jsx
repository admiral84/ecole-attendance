'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
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

export default function MobileHeader() {
  const router = useRouter()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [user, setUser] = useState(null)
  const [userData, setUserData] = useState(null)

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
        
        if (authError || !authUser) {
          return
        }

        setUser(authUser)

        // Try to get user data from users table
        const matricule = authUser.user_metadata?.matricule
        let userInfo = null

        if (matricule) {
          const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('matricule', matricule)
            .single()
          
          if (!error && data) {
            userInfo = data
          }
        }

        if (userInfo) {
          setUserData({
            nom: userInfo.nom,
            prenom: userInfo.prenom,
            role: userInfo.role,
            email: authUser.email,
            matricule: userInfo.matricule
          })
        } else {
          // Use metadata as fallback
          setUserData({
            nom: authUser.user_metadata?.nom || 'مستخدم',
            prenom: authUser.user_metadata?.prenom || '',
            role: authUser.user_metadata?.role || 'teacher',
            email: authUser.email,
            matricule: authUser.user_metadata?.matricule || 'N/A'
          })
        }
      } catch (error) {
        console.error('Error:', error)
      }
    }

    getUser()

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
        setIsMenuOpen(false)
        router.push('/login')
        router.refresh()
      }
    } catch (error) {
      console.error('Logout error:', error)
      toast.error('حدث خطأ في تسجيل الخروج')
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

  const getRoleLabel = (role) => {
    switch(role) {
      case 'admin': return 'مدير'
      case 'teacher': return 'أستاذ'
      case 'manager': return 'إداري'
      default: return 'مستخدم'
    }
  }

  return (
    <div className="md:hidden bg-white shadow-sm fixed top-0 left-0 right-0 z-30">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center space-x-2">
          <span className="text-2xl">🏫</span>
          <span className="font-bold text-lg text-gray-800">معهد عبدالحميد غزواني</span>
        </div>
        
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="p-2 rounded-lg bg-gray-100"
        >
          <span className="text-xl">{isMenuOpen ? '✕' : '☰'}</span>
        </button>
      </div>

      {/* Mobile menu drawer */}
      {isMenuOpen && (
        <div className="absolute top-full left-0 right-0 bg-white shadow-lg border-t border-gray-200 max-h-[80vh] overflow-y-auto">
          <div className="p-4">
            {/* User Info Section */}
            <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white shadow-md">
                  <span className="text-xl">{getFullName().charAt(0) || '👤'}</span>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{getFullName()}</p>
                  <p className="text-sm text-gray-600">{userData?.email || user?.email}</p>
                  <p className="text-xs text-blue-600 mt-1">{getRoleLabel(userData?.role)}</p>
                  {userData?.matricule && userData.matricule !== 'N/A' && (
                    <p className="text-xs text-gray-500 mt-1">معرف: {userData.matricule}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="space-y-1">
              {menuItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <span className="text-xl">{item.icon}</span>
                  <span className="font-medium">{item.name}</span>
                </Link>
              ))}
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200 my-4"></div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all duration-200 font-medium"
            >
              <span>🚪</span>
              <span>تسجيل الخروج</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}