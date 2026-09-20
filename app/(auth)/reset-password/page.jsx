"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { supabase } from "../../../lib/supabase/client";

const MIN_PASSWORD_LENGTH = 6;

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

function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email");

  // Verify the recovery session exists
  useEffect(() => {
    let cancelled = false;

    const checkSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (cancelled) return;

        if (!session) {
          toast.error("الرجاء استخدام رابط إعادة التعيين الصالح");
          router.replace("/login");
          return;
        }

        setCheckingSession(false);
      } catch {
        if (!cancelled) {
          toast.error("تعذر التحقق من الجلسة");
          router.replace("/login");
        }
      }
    };

    checkSession();

    return () => {
      cancelled = true;
    };
  }, [router]);

  // Redirect after success
  useEffect(() => {
    if (!success) return;

    const timer = setTimeout(() => {
      router.replace("/login");
    }, 3000);

    return () => clearTimeout(timer);
  }, [success, router]);

  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (loading) return;

    setError(null);

    if (!password || !confirmPassword) {
      setError("الرجاء تعبئة جميع الحقول");
      return;
    }

    if (password !== confirmPassword) {
      setError("كلمة المرور وتأكيد كلمة المرور غير متطابقين");
      return;
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(
        `كلمة المرور يجب أن تكون ${MIN_PASSWORD_LENGTH} أحرف على الأقل`,
      );
      return;
    }

    setLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        setError(updateError.message || "حدث خطأ في تحديث كلمة المرور");
        return;
      }

      // Sign out the recovery session so the user must log in fresh
      await supabase.auth.signOut();

      setSuccess(true);
      toast.success("تم تغيير كلمة المرور بنجاح");
    } catch {
      setError("حدث خطأ غير متوقع. الرجاء المحاولة لاحقاً");
    } finally {
      setLoading(false);
    }
  };

  // Show a spinner while we verify the session
  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div
          className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"
          role="status"
          aria-label="جارٍ التحقق من الجلسة"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-gray-100">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-teal-600 rounded-2xl shadow-lg mb-4">
              <span className="text-3xl" aria-hidden="true">
                🔐
              </span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              تعيين كلمة مرور جديدة
            </h2>
            <p className="text-gray-600">
              {email
                ? `للبريد الإلكتروني: ${email}`
                : "أدخل كلمة المرور الجديدة لحسابك"}
            </p>
          </div>

          {success ? (
            <div className="text-center space-y-4 mt-8">
              <div
                role="status"
                aria-live="polite"
                className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl"
              >
                تم تغيير كلمة المرور بنجاح! جاري تحويلك إلى صفحة تسجيل
                الدخول...
              </div>
              <Link
                href="/login"
                className="inline-block text-blue-600 hover:text-blue-700 hover:underline"
              >
                الذهاب إلى تسجيل الدخول ←
              </Link>
            </div>
          ) : (
            <form
              className="mt-8 space-y-6"
              onSubmit={handleResetPassword}
              noValidate
            >
              {error && (
                <div
                  role="alert"
                  aria-live="assertive"
                  className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm"
                >
                  {error}
                </div>
              )}

              <div>
                <label
                  htmlFor="new-password"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  كلمة المرور الجديدة
                </label>
                <input
                  id="new-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  placeholder="••••••••"
                  dir="ltr"
                  autoComplete="new-password"
                  disabled={loading}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  يجب أن تكون {MIN_PASSWORD_LENGTH} أحرف على الأقل
                </p>
              </div>

              <div>
                <label
                  htmlFor="confirm-password"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  تأكيد كلمة المرور
                </label>
                <input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  placeholder="••••••••"
                  dir="ltr"
                  autoComplete="new-password"
                  disabled={loading}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                aria-busy={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl text-sm font-medium text-white bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Spinner />
                    جاري تغيير كلمة المرور...
                  </span>
                ) : (
                  "تغيير كلمة المرور"
                )}
              </button>

              <div className="text-center">
                <Link
                  href="/login"
                  className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
                >
                  ← العودة إلى تسجيل الدخول
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div
            className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"
            role="status"
            aria-label="جارٍ التحميل"
          />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}