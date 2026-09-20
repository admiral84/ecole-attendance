"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { supabase } from "../../../lib/supabase/client";
import { checkEmailExists } from "../../actions/users";

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

export default function ForgotPasswordPage() {
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [error, setError] = useState(null);

  const handleEmailChange = (e) => {
    setResetEmail(e.target.value);
    if (error) setError(null);
  };

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
      // 1. Check if email exists and is approved (server action)
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

      // 2. Send password reset email
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        cleanedEmail,
        {
          redirectTo: `${window.location.origin}/reset-password`,
        },
      );

      if (resetError) {
        setError(resetError.message);
        return;
      }

      setResetSent(true);
      setResetEmail("");
      toast.success(
        "تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني",
      );
    } catch {
      setError("حدث خطأ غير متوقع. الرجاء المحاولة مرة أخرى");
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-gray-100">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg mb-4">
              <span className="text-3xl" aria-hidden="true">
                🔑
              </span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              استعادة كلمة المرور
            </h2>
            <p className="text-gray-600">
              أدخل بريدك الإلكتروني لتلقي رابط إعادة التعيين
            </p>
          </div>

          {resetSent ? (
            <div
              role="status"
              aria-live="polite"
              className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm mt-4"
            >
              ✅ تم إرسال رابط إعادة التعيين إلى بريدك الإلكتروني. يرجى التحقق
              من صندوق الوارد.
            </div>
          ) : (
            <>
              {error && (
                <div
                  role="alert"
                  aria-live="assertive"
                  className={`${
                    error.includes("الاتصال بالإدارة")
                      ? "bg-yellow-50 border-yellow-200 text-yellow-800"
                      : "bg-red-50 border-red-200 text-red-700"
                  } px-4 py-3 rounded-xl text-sm border mt-4`}
                >
                  {error}
                </div>
              )}

              <form
                onSubmit={handleForgotPassword}
                className="mt-8 space-y-6"
                noValidate
              >
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
                    onChange={handleEmailChange}
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
            </>
          )}

          <div className="mt-6 text-center">
            <Link
              href="/login"
              aria-disabled={resetLoading}
              tabIndex={resetLoading ? -1 : 0}
              className={`text-sm transition-colors ${
                resetLoading
                  ? "text-gray-400 pointer-events-none"
                  : "text-blue-600 hover:text-blue-700 hover:underline"
              }`}
            >
              ← العودة إلى تسجيل الدخول
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}