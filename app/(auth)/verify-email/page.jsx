"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"

export default function VerifyEmailPage() {
  const router = useRouter()

  const handleResendEmail = async () => {
    try {
      // Call your API endpoint to resend verification email
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
      })
      
      if (response.ok) {
        alert('تم إعادة إرسال رابط التأكيد بنجاح')
      } else {
        alert('حدث خطأ، يرجى المحاولة مرة أخرى')
      }
    } catch (error) {
      console.error('Error resending email:', error)
      alert('حدث خطأ، يرجى المحاولة مرة أخرى')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-gray-100 py-8 px-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md text-center">
        <div className="text-6xl mb-4">📧</div>
        <h1 className="text-2xl font-bold mb-4">تحقق من بريدك الإلكتروني</h1>
        <p className="text-gray-600 mb-4">
          لقد أرسلنا رابط تأكيد إلى بريدك الإلكتروني.
        </p>
        <p className="text-gray-600 mb-6">
          الرجاء النقر على الرابط في البريد الإلكتروني لتفعيل حسابك.
        </p>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-yellow-800">
            ⚠️ لم تستلم البريد؟ تحقق من مجلد البريد العشوائي (Spam/Junk)
          </p>
        </div>
        <div className="space-y-3">
          <Link 
            href="/login" 
            className="inline-block w-full bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition text-center"
          >
            العودة إلى تسجيل الدخول
          </Link>
          <button
            onClick={handleResendEmail}
            className="w-full text-blue-600 hover:text-blue-700 text-sm"
          >
            لم تستلم البريد؟ إعادة إرسال رابط التأكيد
          </button>
        </div>
      </div>
    </div>
  )
}