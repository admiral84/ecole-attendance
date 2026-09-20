"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { supabase } from "../../../lib/supabase/client";
import { checkEmailExists, getCurrentUser } from "../../actions/users";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function Spinner() {
  return (
    <svg
      className="animate-spin h-5 w-5 text-white"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Forgot password state
  const [showForgot, setShowForgot] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  const router = useRouter();

  // Redirect if already authenticated
  useEffect(() => {
    let cancelled = false;

    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!cancelled && session) {
        router.replace("/");
      }
    };

    checkSession();

    return () => {
      cancelled = true;
    };
  }, [router]);

  // ---------- Login ----------
  const handleLogin = async (e) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError(null);

    const cleanedEmail = email.trim().toLowerCase();

    if (!EMAIL_REGEX.test(cleanedEmail)) {
      setError("الرجاء إدخال بريد إلكتروني صحيح");
      setLoading(false);
      return;
    }

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: cleanedEmail,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        return;
      }

      // Use server action to fetch user profile
      const { user, error: userError } = await getCurrentUser();

      if (userError || !user) {
        await supabase.auth.signOut();
        setError("حسابك غير موجود. الرجاء التسجيل أولاً");
        return;
      }

      if (!user.approved) {
        await supabase.auth.signOut();
        setError(
          "❌ حسابك في انتظار الموافقة. الرجاء الاتصال بالإدارة لتفعيل حسابك",
        );
        return;
      }

      toast.success(`مرحباً ${user.nom || ""} ${user.prenom || ""}`.trim());
      router.replace("/");
      router.refresh();
    } catch {
      setError("حدث خطأ غير متوقع. الرجاء المحاولة مرة أخرى");
    } finally {
      setLoading(false);
    }
  };

  // ---------- Forgot Password ----------
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (resetLoading) return;

    setResetLoading(true);
    setError(null);

    const cleanedEmail = resetEmail.trim().toLowerCase();

    if (!EMAIL_REGEX.test(cleanedEmail)) {
      setError("الرجاء إدخال بريد إلكتروني صحيح");
      setResetLoading(false);
      return;
    }

    try {
      // 1. Check if email exists and is approved
      const {
        exists,
        approved,
        error: emailError,
      } = await checkEmailExists(cleanedEmail);

      if (emailError || !exists) {
        setError("البريد الإلكتروني غير مسجل في النظام");
        return;
      }

      if (!approved) {
        setError(
          "❌ حسابك في انتظار الموافقة. الرجاء الاتصال بالإدارة لتفعيل حسابك",
        );
        return;
      }

      // 2. Send password reset email (link)
      const { error: resetError } =
        await supabase.auth.resetPasswordForEmail(cleanedEmail, {
          redirectTo: `${window.location.origin}/verify-otp?email=${encodeURIComponent(
            cleanedEmail,
          )}`,
        });

      if (resetError) {
        setError(resetError.message);
        return;
      }

      toast.success(
        "تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني",
      );

      router.push(`/verify-otp?email=${encodeURIComponent(cleanedEmail)}`);
      setResetEmail("");
    } catch {
      setError("حدث خطأ غير متوقع. الرجاء المحاولة مرة أخرى");
    } finally {
      setResetLoading(false);
    }
  };

  const goToForgot = () => {
    setShowForgot(true);
    setError(null);
  };

  const goToLogin = () => {
    setShowForgot(false);
    setError(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-gray-100">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg mb-4">
              <span className="text-3xl" aria-hidden="true">
                🏫
              </span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              تسجيل الدخول
            </h2>
            <p className="text-gray-600">
              أدخل بريدك الإلكتروني وكلمة المرور
            </p>
          </div>

          {!showForgot ? (
            /* ---------- Login Form ---------- */
            <form
              className="mt-8 space-y-6"
              onSubmit={handleLogin}
              noValidate
            >
              {error && (
                <div
                  role="alert"
                  aria-live="assertive"
                  className={`${
                    error.includes("الاتصال بالإدارة")
                      ? "bg-yellow-50 border-yellow-200 text-yellow-800"
                      : "bg-red-50 border-red-200 text-red-700"
                  } px-4 py-3 rounded-xl text-sm border`}
                >
                  {error}
                </div>
              )}

              <div>
                <label
                  htmlFor="login-email"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  البريد الإلكتروني
                </label>
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  placeholder="example@email.com"
                  required
                  dir="ltr"
                  autoComplete="email"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck="false"
                  disabled={loading}
                />
              </div>

              <div>
                <label
                  htmlFor="login-password"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  كلمة المرور
                </label>
                <input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  placeholder="••••••••"
                  required
                  dir="ltr"
                  autoComplete="current-password"
                  disabled={loading}
                />
              </div>

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={goToForgot}
                  disabled={loading}
                  className="text-sm text-blue-600 hover:text-blue-700 hover:underline transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  نسيت كلمة المرور؟
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                aria-busy={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Spinner />
                    جاري تسجيل الدخول...
                  </span>
                ) : (
                  "تسجيل الدخول"
                )}
              </button>

              <div className="text-center">
                <p className="text-sm text-gray-600">
                  ليس لديك حساب؟{" "}
                  <Link
                    href="/register"
                    className="text-blue-600 hover:text-blue-700 hover:underline font-medium"
                  >
                    إنشاء حساب جديد
                  </Link>
                </p>
              </div>
            </form>
          ) : (
            /* ---------- Forgot Password Form ---------- */
            <div className="mt-8">
              <button
                type="button"
                onClick={goToLogin}
                disabled={resetLoading}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors mb-4 inline-flex items-center disabled:opacity-60 disabled:cursor-not-allowed"
              >
                ← العودة إلى تسجيل الدخول
              </button>

              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                استعادة كلمة المرور
              </h3>
              <p className="text-gray-600 text-sm mb-6">
                أدخل بريدك الإلكتروني وسنرسل لك رابطاً لإعادة تعيين كلمة
                المرور.
              </p>

              <form
                onSubmit={handleForgotPassword}
                className="space-y-4"
                noValidate
              >
                {error && (
                  <div
                    role="alert"
                    aria-live="assertive"
                    className={`${
                      error.includes("الاتصال بالإدارة")
                        ? "bg-yellow-50 border-yellow-200 text-yellow-800"
                        : "bg-red-50 border-red-200 text-red-700"
                    } px-4 py-3 rounded-xl text-sm border`}
                  >
                    {error}
                  </div>
                )}

                <div>
                  <label
                    htmlFor="reset-email"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    البريد الإلكتروني
                  </label>
                  <input
                    id="reset-email"
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    placeholder="example@email.com"
                    required
                    dir="ltr"
                    autoComplete="email"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck="false"
                    disabled={resetLoading}
                  />
                </div>

                <button
                  type="submit"
                  disabled={resetLoading}
                  aria-busy={resetLoading}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {resetLoading ? (
                    <span className="flex items-center gap-2">
                      <Spinner />
                      جاري الإرسال...
                    </span>
                  ) : (
                    "إرسال رابط إعادة التعيين"
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}