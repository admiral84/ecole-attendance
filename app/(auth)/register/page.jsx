'use client'

import { useState } from 'react'
import { supabase } from '../../../lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    nom: '',
    prenom: '',
    matricule: '',
    phone: '',
    role: 'teacher'
  })

  function handleChange(e) {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  async function handleRegister(e) {
    e.preventDefault()
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('كلمة المرور غير متطابقة')
      return
    }

    if (formData.password.length < 6) {
      toast.error('كلمة المرور يجب أن تكون 6 أحرف على الأقل')
      return
    }

    setLoading(true)

    // 1. Créer l'utilisateur dans Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          nom: formData.nom,
          prenom: formData.prenom,
          role: formData.role,
          phone: formData.phone
        }
      }
    })

    if (authError) {
      toast.error(authError.message)
      setLoading(false)
      return
    }

    // 2. Ajouter l'utilisateur dans la table users
    if (authData.user) {
      const { error: dbError } = await supabase
        .from('users')
        .insert({
          matricule: formData.matricule,
          nom: formData.nom,
          prenom: formData.prenom,
          role: formData.role,
          email: formData.email,
          phone: formData.phone
        })

      if (dbError) {
        console.error('Error saving to users table:', dbError)
        toast.error('تم إنشاء الحساب ولكن حدث خطأ في حفظ البيانات')
      } else {
        toast.success('تم إنشاء الحساب بنجاح')
        router.push('/login')
      }
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-gray-100 py-8 px-4 sm:py-12">
      <div className="bg-white p-6 sm:p-8 rounded-xl shadow-md w-full max-w-md sm:max-w-lg">
        <div className="text-center mb-6 sm:mb-8">
          <span className="text-4xl sm:text-5xl">🏫</span>
          <h1 className="text-xl sm:text-2xl font-bold mt-2 text-gray-800">إنشاء حساب جديد</h1>
          <p className="text-sm sm:text-base text-gray-600">نظام حضور الطلاب</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          {/* Row 1: First Name & Last Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                الاسم *
              </label>
              <input
                type="text"
                name="nom"
                value={formData.nom}
                onChange={handleChange}
                className="w-full p-2.5 sm:p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                اللقب *
              </label>
              <input
                type="text"
                name="prenom"
                value={formData.prenom}
                onChange={handleChange}
                className="w-full p-2.5 sm:p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                required
              />
            </div>
          </div>

          {/* Row 2: Matricule & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                المعرف (Matricule) *
              </label>
              <input
                type="text"
                name="matricule"
                value={formData.matricule}
                onChange={handleChange}
                className="w-full p-2.5 sm:p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                رقم الهاتف *
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                dir="ltr"
                className="w-full p-2.5 sm:p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                required
              />
            </div>
          </div>

          {/* Row 3: Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              البريد الإلكتروني *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              dir="ltr"
              className="w-full p-2.5 sm:p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              required
            />
          </div>

          {/* Row 4: Password & Confirm Password */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                كلمة المرور *
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full p-2.5 sm:p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                تأكيد كلمة المرور *
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full p-2.5 sm:p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                required
              />
            </div>
          </div>

          {/* Row 5: Role */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              الدور *
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full p-2.5 sm:p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white"
            >
              <option value="teacher">أستاذ</option>
              <option value="admin">مدير</option>
              <option value="parent">ولي أمر</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white p-2.5 sm:p-3 rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed mt-6 font-semibold"
          >
            {loading ? 'جاري إنشاء الحساب...' : 'إنشاء حساب'}
          </button>
        </form>

        <div className="text-center mt-6">
          <p className="text-sm sm:text-base text-gray-600">
            لديك حساب بالفعل؟{' '}
            <Link href="/login" className="text-blue-600 hover:underline font-medium">
              تسجيل الدخول
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}