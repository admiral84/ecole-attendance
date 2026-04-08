'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase/client'
import { toast } from 'sonner'
import { createUser } from '../../../actions/users'

export default function AuthCallbackPage() {
  const router = useRouter()
  const [status, setStatus] = useState('verifying')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const searchParams = new URLSearchParams(window.location.search)
        const tokenHash = searchParams.get('token_hash')
        const type = searchParams.get('type')

        // 1️⃣ Verify OTP
        if (tokenHash && type) {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type
          })

          if (error) {
            setStatus('error')
            setMessage('فشل التأكيد')
            toast.error('فشل التأكيد')
            setTimeout(() => router.push('/login'), 3000)
            return
          }
        }

        // 2️⃣ Get session
        const { data: { session } } = await supabase.auth.getSession()

        if (!session) {
          setStatus('error')
          setMessage('لا توجد جلسة')
          setTimeout(() => router.push('/login'), 3000)
          return
        }

        const user = session.user
        const metadata = user.user_metadata || {}

        // 3️⃣ Validate metadata
        if (!metadata?.matricule || !metadata?.nom) {
          setStatus('error')
          setMessage('بيانات غير مكتملة')
          setTimeout(() => router.push('/login'), 3000)
          return
        }

        const userData = {
          matricule: metadata.matricule,
          nom: metadata.nom,
          prenom: metadata.prenom,
          role: metadata.role || 'teacher',
          phone: metadata.phone || null
        }

        // 4️⃣ Call SERVER ACTION (no API 🔥)
        await createUser(userData)

        // 5️⃣ Success
        setStatus('success')
        setMessage('تم التأكيد بنجاح')
        toast.success('تم التأكيد بنجاح')

        setTimeout(() => {
          router.refresh()
          router.push('/')
        }, 1500)

      } catch (error) {
        setStatus('error')
        setMessage(error.message || 'خطأ غير متوقع')
        setTimeout(() => router.push('/login'), 3000)
      }
    }

    handleCallback()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-gray-100">
      <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md">

        {status === 'verifying' && (
          <>
            <div className="animate-spin h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold">جاري التحقق...</h2>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="text-green-500 text-5xl mb-4">✓</div>
            <h2 className="text-xl font-semibold">{message}</h2>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="text-red-500 text-5xl mb-4">✗</div>
            <h2 className="text-xl font-semibold">{message}</h2>
          </>
        )}

      </div>
    </div>
  )
}