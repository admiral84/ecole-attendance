// components/Profile.jsx
'use client'

import { useState, useEffect } from 'react'
import { getCurrentUser, updateUserProfile, updateUserPassword } from '../../actions/users'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { User, Mail, Phone, Key, Save, Edit2, X, LogOut } from 'lucide-react'

export default function Profile() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [user, setUser] = useState(null)
  const [editMode, setEditMode] = useState(false)
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    phone: '',
    email: '',
    matricule: ''
  })
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  useEffect(() => {
    fetchUserProfile()
  }, [])

  async function fetchUserProfile() {
    try {
      setLoading(true)
      const result = await getCurrentUser()
      
      if (result.error) {
        toast.error(result.error)
        router.push('/login')
        return
      }
      
      if (result.user) {
        setUser(result.user)
        setFormData({
          nom: result.user.nom || '',
          prenom: result.user.prenom || '',
          phone: result.user.phone || '',
          email: result.authUser?.email || result.user.email || '',
          matricule: result.user.matricule || ''
        })
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      toast.error('حدث خطأ في تحميل الملف الشخصي')
    } finally {
      setLoading(false)
    }
  }

  function handleInputChange(e) {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  function handlePasswordChange(e) {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value
    })
  }

  async function handleUpdateProfile(e) {
    e.preventDefault()
    
    if (!formData.nom || !formData.prenom) {
      toast.error('الاسم واللقب مطلوبان')
      return
    }
    
    setUpdating(true)
    
    try {
      const result = await updateUserProfile({
        nom: formData.nom,
        prenom: formData.prenom,
        phone: formData.phone
      })
      
      if (result.success) {
        toast.success('تم تحديث الملف الشخصي بنجاح')
        setEditMode(false)
        await fetchUserProfile() // Refresh data
      } else {
        toast.error(result.error || 'حدث خطأ في التحديث')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('حدث خطأ غير متوقع')
    } finally {
      setUpdating(false)
    }
  }

  async function handleUpdatePassword(e) {
    e.preventDefault()
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('كلمة المرور الجديدة غير متطابقة')
      return
    }
    
    if (passwordData.newPassword.length < 6) {
      toast.error('كلمة المرور يجب أن تكون 6 أحرف على الأقل')
      return
    }
    
    setUpdating(true)
    
    try {
      const result = await updateUserPassword(
        passwordData.currentPassword,
        passwordData.newPassword
      )
      
      if (result.success) {
        toast.success('تم تحديث كلمة المرور بنجاح')
        setShowPasswordForm(false)
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        })
      } else {
        toast.error(result.error || 'حدث خطأ في تحديث كلمة المرور')
      }
    } catch (error) {
      console.error('Error updating password:', error)
      toast.error('حدث خطأ غير متوقع')
    } finally {
      setUpdating(false)
    }
  }

  async function handleLogout() {
    const { supabase } = await import('../../../lib/supabase/client')
    await supabase.auth.signOut()
    router.push('/login')
    toast.success('تم تسجيل الخروج بنجاح')
  }

  function getRoleLabel(role) {
    const roles = {
      admin: 'مدير',
      teacher: 'أستاذ',
      parent: 'ولي أمر',
      student: 'تلميذ'
    }
    return roles[role] || role
  }

  function getRoleColor(role) {
    const colors = {
      admin: 'bg-purple-100 text-purple-800',
      teacher: 'bg-blue-100 text-blue-800',
      parent: 'bg-green-100 text-green-800',
      student: 'bg-orange-100 text-orange-800'
    }
    return colors[role] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل الملف الشخصي...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-gray-100 py-4 sm:py-8 px-2 sm:px-4">
      <div className="container mx-auto max-w-4xl">
        
        {/* Header */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 mb-4 sm:mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xl sm:text-2xl font-bold">
                  {user?.nom?.[0]}{user?.prenom?.[0]}
                </span>
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
                  {user?.nom} {user?.prenom}
                </h1>
                <p className="text-gray-600 text-sm">المعرف: {user?.matricule}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors flex items-center gap-2 text-sm sm:text-base"
              >
                <LogOut size={18} />
                <span className="hidden sm:inline">تسجيل خروج</span>
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
          
          {/* Profile Information */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6">
              <div className="flex justify-between items-center mb-4 sm:mb-6">
                <h2 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center gap-2">
                  <User size={20} />
                  المعلومات الشخصية
                </h2>
                {!editMode ? (
                  <button
                    onClick={() => setEditMode(true)}
                    className="px-3 sm:px-4 py-1 sm:py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center gap-2 text-sm sm:text-base"
                  >
                    <Edit2 size={16} />
                    تعديل
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setEditMode(false)
                      fetchUserProfile()
                    }}
                    className="px-3 sm:px-4 py-1 sm:py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors flex items-center gap-2 text-sm sm:text-base"
                  >
                    <X size={16} />
                    إلغاء
                  </button>
                )}
              </div>

              {!editMode ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">الاسم</label>
                      <p className="text-gray-800 text-base sm:text-lg">{user?.nom || '—'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">اللقب</label>
                      <p className="text-gray-800 text-base sm:text-lg">{user?.prenom || '—'}</p>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1 flex items-center gap-2">
                      <Mail size={16} />
                      البريد الإلكتروني
                    </label>
                    <p className="text-gray-800 text-base sm:text-lg">{formData.email || '—'}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1 flex items-center gap-2">
                      <Phone size={16} />
                      رقم الهاتف
                    </label>
                    <p className="text-gray-800 text-base sm:text-lg">{user?.phone || '—'}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">الدور</label>
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getRoleColor(user?.role)}`}>
                      {getRoleLabel(user?.role)}
                    </span>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">الاسم *</label>
                      <input
                        type="text"
                        name="nom"
                        value={formData.nom}
                        onChange={handleInputChange}
                        className="w-full p-2 sm:p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">اللقب *</label>
                      <input
                        type="text"
                        name="prenom"
                        value={formData.prenom}
                        onChange={handleInputChange}
                        className="w-full p-2 sm:p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">رقم الهاتف</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full p-2 sm:p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      dir="ltr"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">البريد الإلكتروني</label>
                    <input
                      type="email"
                      value={formData.email}
                      disabled
                      className="w-full p-2 sm:p-3 border rounded-xl bg-gray-50 text-gray-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">لا يمكن تغيير البريد الإلكتروني</p>
                  </div>
                  
                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      disabled={updating}
                      className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {updating ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          جاري الحفظ...
                        </>
                      ) : (
                        <>
                          <Save size={18} />
                          حفظ التغييرات
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Password Change Card */}
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center gap-2 mb-4">
                <Key size={20} />
                تغيير كلمة المرور
              </h2>
              
              {!showPasswordForm ? (
                <button
                  onClick={() => setShowPasswordForm(true)}
                  className="w-full px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors"
                >
                  تغيير كلمة المرور
                </button>
              ) : (
                <form onSubmit={handleUpdatePassword} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">كلمة المرور الحالية</label>
                    <input
                      type="password"
                      name="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      className="w-full p-2 sm:p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">كلمة المرور الجديدة</label>
                    <input
                      type="password"
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      className="w-full p-2 sm:p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">تأكيد كلمة المرور الجديدة</label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      className="w-full p-2 sm:p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={updating}
                      className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
                    >
                      {updating ? 'جاري التحديث...' : 'تحديث'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowPasswordForm(false)
                        setPasswordData({
                          currentPassword: '',
                          newPassword: '',
                          confirmPassword: ''
                        })
                      }}
                      className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
                    >
                      إلغاء
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Account Info Card */}
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4">معلومات الحساب</h2>
              <div className="space-y-3 text-sm">
                <div>
                  <label className="text-gray-600">المعرف:</label>
                  <p className="text-gray-800 font-mono">{user?.matricule}</p>
                </div>
                <div>
                  <label className="text-gray-600">تاريخ التسجيل:</label>
                  <p className="text-gray-800">
                    {user?.created_at ? new Date(user.created_at).toLocaleDateString('ar') : '—'}
                  </p>
                </div>
                <div>
                  <label className="text-gray-600">آخر تحديث:</label>
                  <p className="text-gray-800">
                    {user?.updated_at ? new Date(user.updated_at).toLocaleDateString('ar') : '—'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}