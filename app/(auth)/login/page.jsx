// app/login/page.js
'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [forgotPassword, setForgotPassword] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetLoading, setResetLoading] = useState(false)
  const router = useRouter()
  
  // إنشاء client في المتصفح
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  )

  // التحقق من وجود جلسة نشطة عند تحميل الصفحة
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        router.push('/')
      }
    }
    checkSession()
  }, [router, supabase])

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (signInError) {
        if (signInError.message === 'Invalid login credentials') {
          setError('البريد الإلكتروني أو كلمة المرور غير صحيحة')
        } else if (signInError.message.includes('Email not confirmed')) {
          setError('الرجاء تأكيد بريدك الإلكتروني أولاً')
        } else {
          setError(signInError.message)
        }
        setLoading(false)
        return
      }
      
      if (data?.user) {
        toast.success('تم تسجيل الدخول بنجاح')
        router.push('/')
        router.refresh()
      }
    } catch (err) {
      console.error('Unexpected error:', err)
      setError('حدث خطأ غير متوقع')
    }
    
    setLoading(false)
  }

  const handleForgotPassword = async (e) => {
    e.preventDefault()
    if (!resetEmail) {
      toast.error('الرجاء إدخال البريد الإلكتروني')
      return
    }

    setResetLoading(true)
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      
      if (error) {
        toast.error(error.message)
      } else {
        toast.success('تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني')
        setForgotPassword(false)
        setResetEmail('')
      }
    } catch (err) {
      toast.error('حدث خطأ غير متوقع')
    }
    
    setResetLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        
        {!forgotPassword ? (
          // Login Form
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-gray-100">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg mb-4">
                <span className="text-3xl">🏫</span>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">تسجيل الدخول</h2>
              <p className="text-gray-600">مرحباً بك في معهد عبدالحميد غزواني</p>
            </div>
            
            <form className="mt-8 space-y-6" onSubmit={handleLogin}>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                  {error}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  البريد الإلكتروني
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="example@email.com"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  كلمة المرور
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
              
              <div className="flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => setForgotPassword(true)}
                  className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
                >
                  نسيت كلمة المرور؟
                </button>
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    جاري تسجيل الدخول...
                  </span>
                ) : (
                  'تسجيل الدخول'
                )}
              </button>
            </form>
            
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                ليس لديك حساب؟{' '}
                <Link href="/register" className="text-blue-600 hover:text-blue-700 hover:underline font-medium">
                  إنشاء حساب جديد
                </Link>
              </p>
            </div>
          </div>
        ) : (
          // Forgot Password Form
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-gray-100">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl shadow-lg mb-4">
                <span className="text-3xl">🔐</span>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">نسيت كلمة المرور</h2>
              <p className="text-gray-600">أدخل بريدك الإلكتروني لإعادة تعيين كلمة المرور</p>
            </div>
            
            <form className="mt-8 space-y-6" onSubmit={handleForgotPassword}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  البريد الإلكتروني
                </label>
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="example@email.com"
                  required
                />
              </div>
              
              <button
                type="submit"
                disabled={resetLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 disabled:opacity-50"
              >
                {resetLoading ? 'جاري الإرسال...' : 'إرسال رابط إعادة التعيين'}
              </button>
              
              <button
                type="button"
                onClick={() => setForgotPassword(false)}
                className="w-full text-center text-sm text-gray-600 hover:text-gray-800"
              >
                ← العودة إلى تسجيل الدخول
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}