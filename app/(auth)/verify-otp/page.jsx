"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { verifyRecoveryOTP } from "../../actions/users";

const OTP_LENGTH = 8;
const REDIRECT_DELAY_MS = 1000;

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

function VerifyOtpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const email = searchParams.get("email") || "";

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Redirect after success, with cleanup
  useEffect(() => {
    if (!success) return;

    const timer = setTimeout(() => {
      router.replace("/reset-password");
    }, REDIRECT_DELAY_MS);

    return () => clearTimeout(timer);
  }, [success, router]);

  const handleOtpChange = (e) => {
    const digits = e.target.value.replace(/\D/g, "").slice(0, OTP_LENGTH);
    setOtp(digits);
    if (error) setError("");
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();

    if (loading || success) return;

    setError("");

    if (!email) {
      setError(
        "البريد الإلكتروني مفقود، يرجى العودة إلى صفحة استعادة كلمة المرور",
      );
      return;
    }

    if (otp.length !== OTP_LENGTH) {
      setError(`الرجاء إدخال رمز مكون من ${OTP_LENGTH} أرقام`);
      return;
    }

    setLoading(true);

    try {
      const result = await verifyRecoveryOTP(email, otp);

      if (!result?.success) {
        setError(result?.error || "حدث خطأ غير متوقع");
        return;
      }

      setSuccess(true);
    } catch {
      setError("حدث خطأ غير متوقع. الرجاء المحاولة لاحقاً");
    } finally {
      setLoading(false);
    }
  };

  const isSubmitDisabled = loading || success || otp.length !== OTP_LENGTH;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-gray-100 py-12 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl" aria-hidden="true">
                🔐
              </span>
            </div>

            <h1 className="text-3xl font-bold">التحقق من رمز الاستعادة</h1>

            <p className="text-gray-500 mt-3">
              تم إرسال رمز مكون من {OTP_LENGTH} أرقام إلى
            </p>

            <p className="font-semibold text-blue-600 break-all mt-2">
              {email || "—"}
            </p>
          </div>

          {error && (
            <div
              role="alert"
              aria-live="assertive"
              className="mb-5 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3"
            >
              {error}
            </div>
          )}

          {success && (
            <div
              role="status"
              aria-live="polite"
              className="mb-5 bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3"
            >
              ✅ تم التحقق من الرمز بنجاح...
            </div>
          )}

          <form
            onSubmit={handleVerifyOtp}
            className="space-y-6"
            noValidate
          >
            <div>
              <label
                htmlFor="otp"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                رمز التحقق
              </label>

              <input
                id="otp"
                type="text"
                value={otp}
                onChange={handleOtpChange}
                maxLength={OTP_LENGTH}
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="one-time-code"
                placeholder={"0".repeat(OTP_LENGTH)}
                dir="ltr"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-center tracking-[0.4em] text-xl focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
                disabled={loading || success}
                required
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitDisabled}
              aria-busy={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 text-white py-3 font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Spinner />
                  جاري التحقق...
                </>
              ) : success ? (
                "تم التحقق"
              ) : (
                "تحقق من الرمز"
              )}
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

export default function VerifyOtpPage() {
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
      <VerifyOtpForm />
    </Suspense>
  );
}