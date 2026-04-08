'use client'

import { useState } from 'react'
import { supabase } from '../../../lib/supabase/client'
import { toast } from 'sonner'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleReset(e) {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`
    })

    if (error) {
      toast.error('حدث خطأ، حاول مرة أخرى')
    } else {
      toast.success('تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني')
      setEmail('')
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-gray-100 px-4 py-8">
      <div className="w-full max-w-md bg-white rounded-xl shadow-md p-6 sm:p-8">
        
        {/* Header */}
        <div className="text-center mb-6">
          <span className="text-4xl sm:text-5xl">🔑</span>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mt-2">
            استعادة كلمة المرور
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            أدخل بريدك الإلكتروني لإرسال رابط إعادة التعيين
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleReset} className="space-y-4">
          <input
            type="email"
            placeholder="البريد الإلكتروني"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2.5 sm:p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white p-2.5 sm:p-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
          >
            {loading ? 'جاري الإرسال...' : 'إرسال رابط التعيين'}
          </button>
        </form>

        {/* Back to login */}
        <div className="text-center mt-6">
          <Link
            href="/login"
            className="text-sm sm:text-base text-blue-600 hover:underline font-medium"
          >
            العودة إلى تسجيل الدخول
          </Link>
        </div>

      </div>
    </div>
  )
}