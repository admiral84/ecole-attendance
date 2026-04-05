'use client'

import { useState } from 'react'
import { supabase } from '../../../lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (error) {
      toast.error('خطأ في تسجيل الدخول')
    } else {
      toast.success('تم تسجيل الدخول بنجاح')
      router.push('/')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-gray-100 py-8 px-4">
      <div className="bg-white p-6 sm:p-8 rounded-xl shadow-md w-full max-w-md">
        <div className="text-center mb-8">
          <span className="text-4xl sm:text-5xl">🏫</span>
          <h1 className="text-xl sm:text-2xl font-bold mt-2 text-gray-800">تسجيل الدخول</h1>
          <p className="text-sm sm:text-base text-gray-600">نظام حضور الطلاب</p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            placeholder="البريد الإلكتروني"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2.5 sm:p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            required
          />
          <input
            type="password"
            placeholder="كلمة المرور"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2.5 sm:p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white p-2.5 sm:p-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
          >
            {loading ? 'جاري التسجيل...' : 'دخول'}
          </button>
        </form>

        <div className="text-center mt-6">
          <p className="text-sm sm:text-base text-gray-600">
            ليس لديك حساب؟{' '}
            <Link href="/register" className="text-blue-600 hover:underline font-medium">
              إنشاء حساب جديد
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}