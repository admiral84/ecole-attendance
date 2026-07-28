'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { supabase } from '../../../lib/supabase/client';
import { checkEmailExists, getCurrentUser } from '../../actions/users';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Forgot password state
  const [showForgot, setShowForgot] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const router = useRouter();

  // Check for existing session
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push('/');
      }
    };
    checkSession();
  }, [router]);

  // ---------- Login ----------
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    // Use server action to fetch user profile
    const { user, error: userError } = await getCurrentUser();

    if (userError || !user) {
      await supabase.auth.signOut();
      setError('حسابك غير موجود. الرجاء التسجيل أولاً');
      setLoading(false);
      return;
    }

    if (!user.approved) {
      await supabase.auth.signOut();
      setError('❌ حسابك في انتظار الموافقة. الرجاء الاتصال بالإدارة لتفعيل حسابك');
      setLoading(false);
      return;
    }

    toast.success(`مرحباً ${user.nom || ''} ${user.prenom || ''}`);
    router.push('/');
    router.refresh();
    setLoading(false);
  };

  // ---------- Forgot Password ----------
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setResetLoading(true);
    setError(null);
    setResetSent(false);

    const cleanedEmail = resetEmail.trim().toLowerCase();

    // 1. Check if email exists and is approved
    const { exists, approved, error: emailError } = await checkEmailExists(cleanedEmail);

    if (emailError || !exists) {
      setError('البريد الإلكتروني غير مسجل في النظام');
      setResetLoading(false);
      return;
    }

    if (!approved) {
      setError('❌ حسابك في انتظار الموافقة. الرجاء الاتصال بالإدارة لتفعيل حسابك');
      setResetLoading(false);
      return;
    }

    // 2. Send password reset email (link)
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(cleanedEmail, {
      
    });

    if (resetError) {
      setError(resetError.message);
      setResetLoading(false);
      return;
    }

    setResetSent(true);
    toast.success('تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني');
    router.push(`/verify-otp?email=${encodeURIComponent(cleanedEmail)}`);
    setResetEmail('');
    // Optionally close the forgot section after a few seconds
    setTimeout(() => {
      setShowForgot(false);
      setResetSent(false);
    }, 5000);
    setResetLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-gray-100">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg mb-4">
              <span className="text-3xl">🏫</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">تسجيل الدخول</h2>
            <p className="text-gray-600">أدخل بريدك الإلكتروني وكلمة المرور</p>
          </div>

          {/* Show login form OR forgot password form */}
          {!showForgot ? (
            // ---------- Login Form ----------
            <form className="mt-8 space-y-6" onSubmit={handleLogin}>
              {error && (
                <div className={`${
                  error.includes('الاتصال بالإدارة')
                    ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
                    : 'bg-red-50 border-red-200 text-red-700'
                } px-4 py-3 rounded-xl text-sm border`}>
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
                  dir="ltr"
                />
              </div>

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setShowForgot(true);
                    setError(null);
                    setResetSent(false);
                  }}
                  className="text-sm text-blue-600 hover:text-blue-700 hover:underline transition-colors"
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

              <div className="text-center">
                <p className="text-sm text-gray-600">
                  ليس لديك حساب؟{' '}
                  <Link href="/register" className="text-blue-600 hover:text-blue-700 hover:underline font-medium">
                    إنشاء حساب جديد
                  </Link>
                </p>
              </div>
            </form>
          ) : (
            // ---------- Forgot Password Form ----------
            <div className="mt-8">
              <button
                type="button"
                onClick={() => {
                  setShowForgot(false);
                  setError(null);
                  setResetSent(false);
                }}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors mb-4 inline-flex items-center"
              >
                ← العودة إلى تسجيل الدخول
              </button>

              <h3 className="text-xl font-semibold text-gray-800 mb-2">استعادة كلمة المرور</h3>
              <p className="text-gray-600 text-sm mb-6">
                أدخل بريدك الإلكتروني وسنرسل لك رابطاً لإعادة تعيين كلمة المرور.
              </p>

              {resetSent ? (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm">
                  ✅ تم إرسال رابط إعادة التعيين إلى بريدك الإلكتروني. يرجى التحقق من صندوق الوارد.
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  {error && (
                    <div className={`${
                      error.includes('الاتصال بالإدارة')
                        ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
                        : 'bg-red-50 border-red-200 text-red-700'
                    } px-4 py-3 rounded-xl text-sm border`}>
                      {error}
                    </div>
                  )}

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
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}