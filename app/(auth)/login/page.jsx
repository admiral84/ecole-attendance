'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { supabase } from '../../../lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [forgotPassword, setForgotPassword] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetLoading, setResetLoading] = useState(false)
  const [isChecking, setIsChecking] = useState(true)
  const router = useRouter()

  // Check for existing session on page load
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          router.push('/')
          return
        }
      } catch (error) {
        console.log('No active session')
      } finally {
        setIsChecking(false)
      }
    }
    
    checkSession()
  }, [router])

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    try {
      // Attempt login first
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
        // After successful login, check/update user record
        try {
          // Check if user exists in users table
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('approved, user_id')
            .eq('user_id', data.user.id)
            .maybeSingle()
          
          // If no user record exists, create one
          if (userError || !userData) {
            console.log('Creating user record for logged-in user')
            const { error: insertError } = await supabase
              .from('users')
              .insert({
                user_id: data.user.id,
                email: data.user.email,
                matricule: data.user.id.substring(0, 8),
                nom: data.user.user_metadata?.nom || 'مستخدم',
                prenom: data.user.user_metadata?.prenom || '',
                role: data.user.user_metadata?.role || 'teacher',
                approved: true // Auto-approve the user
              })
            
            if (insertError) {
              console.error('Error creating user record:', insertError)
            }
            
            toast.success('تم تسجيل الدخول بنجاح')
            router.push('/')
            router.refresh()
            setLoading(false)
            return
          }
          
          // Check if user is approved
          if (userData && userData.approved === false) {
            await supabase.auth.signOut()
            setError('حسابك في انتظار الموافقة من قبل المدير. الرجاء المحاولة لاحقاً.')
            setLoading(false)
            return
          }
          
          toast.success('تم تسجيل الدخول بنجاح')
          router.push('/')
          router.refresh()
          
        } catch (approvalError) {
          console.error('Error checking approval:', approvalError)
          // Fallback: Allow login even if approval check fails
          toast.warning('تم تسجيل الدخول مع تحذير')
          router.push('/')
          router.refresh()
        }
      }
    } catch (err) {
      console.error('Login error:', err)
      setError('حدث خطأ في تسجيل الدخول. الرجاء المحاولة لاحقاً.')
      setLoading(false)
    }
  }

 const handleForgotPassword = async (e) => {
  e.preventDefault()
  
  const cleanedEmail = resetEmail.trim().toLowerCase()
  
  if (!cleanedEmail) {
    toast.error('الرجاء إدخال البريد الإلكتروني')
    return
  }
  
  if (!cleanedEmail.includes('@') || !cleanedEmail.includes('.')) {
    toast.error('صيغة البريد الإلكتروني غير صحيحة')
    return
  }

  setResetLoading(true)
  
  try {
    // Call Supabase directly from the client
    const { data, error } = await supabase.auth.resetPasswordForEmail(cleanedEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    
    if (error) {
      console.error('Reset password error:', error)
      toast.error(`فشل إرسال البريد: ${error.message}`)
    } else {
      toast.success('تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني')
      setForgotPassword(false)
      setResetEmail('')
    }
    
  } catch (err) {
    console.error('Unexpected error:', err)
    toast.error('حدث خطأ غير متوقع. الرجاء المحاولة لاحقاً')
  }
  
  setResetLoading(false)
}
  // Show loading while checking session
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
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
                  dir="ltr"
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
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
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
                  dir="ltr"
                />
              </div>
              
              <button
                type="submit"
                disabled={resetLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {resetLoading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    جاري الإرسال...
                  </span>
                ) : (
                  'إرسال رابط إعادة التعيين'
                )}
              </button>
              
              <button
                type="button"
                onClick={() => setForgotPassword(false)}
                className="w-full text-center text-sm text-gray-600 hover:text-gray-800 transition-colors"
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