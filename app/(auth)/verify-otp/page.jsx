'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { verifyRecoveryOTP } from '../../actions/users';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const email = searchParams.get('email') || '';

  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleVerifyOtp = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError('');

    if (!otp.trim()) {
      setError('الرجاء إدخال رمز التحقق');
      setLoading(false);
      return;
    }

    if (!email) {
      setError('البريد الإلكتروني مفقود، يرجى العودة إلى صفحة استعادة كلمة المرور');
      setLoading(false);
      return;
    }

    const result = await verifyRecoveryOTP(email, otp.trim());

    if (!result.success) {
      setError(result.error || 'حدث خطأ غير متوقع');
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);

    // Wait a moment so the user sees the success message
    setTimeout(() => {
      router.push('/reset-password');
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-gray-100 py-12 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🔐</span>
            </div>

            <h1 className="text-3xl font-bold">التحقق من رمز الاستعادة</h1>

            <p className="text-gray-500 mt-3">
              تم إرسال رمز مكون من 8 أرقام إلى
            </p>

            <p className="font-semibold text-blue-600 break-all mt-2">
              {email}
            </p>
          </div>

          {error && (
            <div className="mb-5 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-5 bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3">
              ✅ تم التحقق من الرمز بنجاح...
            </div>
          )}

          <form onSubmit={handleVerifyOtp} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                رمز التحقق
              </label>

              <input
                type="text"
                value={otp}
                onChange={(e) =>
                  setOtp(e.target.value.replace(/\D/g, ''))
                }
                maxLength={8}
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="12345678"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-center tracking-[0.4em] text-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading || success}
              className="w-full rounded-xl bg-blue-600 text-white py-3 font-semibold hover:bg-blue-700 disabled:opacity-50"
            >
              {loading
                ? 'جاري التحقق...'
                : success
                ? 'تم التحقق'
                : 'تحقق من الرمز'}
            </button>
          </form>

          <div className="text-center mt-6">
            <Link
              href="/login"
              className="text-blue-600 hover:underline"
            >
              ← العودة إلى تسجيل الدخول
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}