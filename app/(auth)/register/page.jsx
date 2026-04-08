'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  // Initialize ALL form fields with empty strings (not undefined)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    nom: '',
    prenom: '',
    matricule: '',
    phone: '',
    role: 'teacher' // role is always a string
  })

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) router.push('/')
    }
    checkUser()
  }, [router])

  function handleChange(e) {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  function validateMatricule(matricule) {
    return /^[A-Za-z0-9]{4,15}$/.test(matricule)
  }

  function validatePhone(phone) {
    return /^[0-9]{8,10}$/.test(phone)
  }

  async function handleRegister(e) {
    e.preventDefault()

    // Validation remains the same
    if (!formData.nom || !formData.prenom || !formData.matricule || !formData.email || !formData.password || !formData.phone) {
      toast.error('الرجاء تعبئة جميع الحقول')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('كلمة المرور غير متطابقة')
      return
    }

    if (formData.password.length < 6) {
      toast.error('كلمة المرور يجب أن تكون 6 أحرف على الأقل')
      return
    }

    if (!validateMatricule(formData.matricule)) {
      toast.error('المعرف غير صالح')
      return
    }

    if (!validatePhone(formData.phone)) {
      toast.error('رقم الهاتف غير صحيح')
      return
    }

    setLoading(true)

    try {
      // Create AUTH user
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            nom: formData.nom,
            prenom: formData.prenom,
            role: formData.role,
            matricule: formData.matricule,
            phone: formData.phone
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (signUpError) {
        if (signUpError.message.includes('User already registered')) {
          toast.error('هذا البريد الإلكتروني مسجل بالفعل')
        } else {
          toast.error(signUpError.message)
        }
        setLoading(false)
        return
      }

      // Insert user into database with email
      if (authData.user) {
        const { error: insertError } = await supabase
          .from('users')
          .insert([
            {
              matricule: formData.matricule,
              nom: formData.nom,
              prenom: formData.prenom,
              role: formData.role,
              phone: formData.phone,
              email: formData.email,
              user_id: authData.user.id
            }
          ])

        if (insertError) {
          console.error('Error inserting user:', insertError)
          toast.error('تم إنشاء الحساب ولكن حدث خطأ في حفظ البيانات')
        } else {
          toast.success('تم إنشاء الحساب بنجاح!')
          
          // Redirect based on role
          if (formData.role === 'teacher') {
            setTimeout(() => {
              router.push('/complete-profile')
            }, 1500)
          } else {
            toast.success('تحقق من بريدك الإلكتروني للتأكيد')
            setTimeout(() => {
              router.push('/login')
            }, 2000)
          }
        }
      }

    } catch (err) {
      console.error('Registration error:', err)
      toast.error('حدث خطأ غير متوقع')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-gray-100 py-8 px-4 sm:py-12">
      <div className="bg-white/80 backdrop-blur-sm p-6 sm:p-8 rounded-2xl shadow-xl w-full max-w-md sm:max-w-lg border border-gray-100">

        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg mb-4">
            <span className="text-3xl">🏫</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold">إنشاء حساب جديد</h1>
          {formData.role === 'teacher' && (
            <p className="text-sm text-gray-600 mt-2">
              ستحتاج لإكمال ملفك الشخصي بعد التسجيل
            </p>
          )}
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input 
              name="nom" 
              placeholder="الاسم" 
              value={formData.nom}  // Always a string
              onChange={handleChange} 
              className="p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500" 
              required 
            />
            <input 
              name="prenom" 
              placeholder="اللقب" 
              value={formData.prenom}  // Always a string
              onChange={handleChange} 
              className="p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500" 
              required 
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input 
              name="matricule" 
              placeholder="المعرف" 
              value={formData.matricule}  // Always a string
              onChange={handleChange} 
              className="p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500" 
              required 
            />
            <input 
              name="phone" 
              placeholder="رقم الهاتف" 
              value={formData.phone}  // Always a string
              onChange={handleChange} 
              className="p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500" 
              required 
            />
          </div>

          <input 
            type="email" 
            name="email" 
            placeholder="البريد الإلكتروني" 
            value={formData.email}  // Always a string
            onChange={handleChange} 
            className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500" 
            required 
          />

          <div className="grid grid-cols-2 gap-4">
            <input 
              type="password" 
              name="password" 
              placeholder="كلمة المرور" 
              value={formData.password}  // Always a string
              onChange={handleChange} 
              className="p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500" 
              required 
            />
            <input 
              type="password" 
              name="confirmPassword" 
              placeholder="تأكيد كلمة المرور" 
              value={formData.confirmPassword}  // Always a string
              onChange={handleChange} 
              className="p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500" 
              required 
            />
          </div>

          <select 
            name="role" 
            value={formData.role}  // Always a string (default 'teacher')
            onChange={handleChange} 
            className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="teacher">👨‍🏫 أستاذ</option>
            <option value="admin">👨‍💼 مدير</option>
            <option value="parent">👨‍👩‍👧 إداري</option>
          </select>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white p-3 rounded-xl font-semibold transition-all duration-200 disabled:opacity-50"
          >
            {loading ? 'جاري إنشاء الحساب...' : 'إنشاء حساب'}
          </button>
        </form>

        <div className="text-center mt-6">
          <Link href="/login" className="text-green-600 hover:text-green-700 hover:underline">
            لديك حساب؟ تسجيل الدخول
          </Link>
        </div>
      </div>
    </div>
  )
}