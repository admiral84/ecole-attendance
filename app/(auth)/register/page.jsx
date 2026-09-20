"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MATRICULE_REGEX = /^[A-Za-z0-9]{4,15}$/;
const PHONE_REGEX = /^[0-9]{8,10}$/;

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

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    nom: "",
    prenom: "",
    matricule: "",
    phone: "",
    role: "teacher",
  });

  // Redirect if already authenticated
  useEffect(() => {
    let cancelled = false;

    const checkUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!cancelled && session) {
        router.replace("/");
      }
    };

    checkUser();

    return () => {
      cancelled = true;
    };
  }, [router]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    if (loading) return;

    const {
      nom,
      prenom,
      matricule,
      email,
      phone,
      password,
      confirmPassword,
      role,
    } = formData;

    const cleanedEmail = email.trim().toLowerCase();
    const cleanedMatricule = matricule.trim();
    const cleanedPhone = phone.trim();

    // ---------- Validation ----------
    if (
      !nom.trim() ||
      !prenom.trim() ||
      !cleanedMatricule ||
      !cleanedEmail ||
      !password ||
      !cleanedPhone
    ) {
      toast.error("الرجاء تعبئة جميع الحقول");
      return;
    }

    if (!EMAIL_REGEX.test(cleanedEmail)) {
      toast.error("الرجاء إدخال بريد إلكتروني صحيح");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("كلمة المرور غير متطابقة");
      return;
    }

    if (password.length < 6) {
      toast.error("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
      return;
    }

    if (!MATRICULE_REGEX.test(cleanedMatricule)) {
      toast.error("المعرف غير صالح (4-15 حروف وأرقام فقط)");
      return;
    }

    if (!PHONE_REGEX.test(cleanedPhone)) {
      toast.error("رقم الهاتف غير صحيح (8-10 أرقام)");
      return;
    }

    setLoading(true);

    try {
      // 1. Create AUTH user
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: cleanedEmail,
        password,
        options: {
          data: {
            nom: nom.trim(),
            prenom: prenom.trim(),
            role,
            matricule: cleanedMatricule,
            phone: cleanedPhone,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (signUpError) {
        if (signUpError.message.includes("User already registered")) {
          toast.error("هذا البريد الإلكتروني مسجل بالفعل");
        } else {
          toast.error(signUpError.message);
        }
        return;
      }

      // 2. Insert user into database with user_id as primary key
      if (!authData?.user) {
        toast.error("تعذر إنشاء الحساب. الرجاء المحاولة مرة أخرى");
        return;
      }

      const { error: insertError } = await supabase.from("users").insert([
        {
          user_id: authData.user.id,
          matricule: cleanedMatricule,
          nom: nom.trim(),
          prenom: prenom.trim(),
          role,
          phone: cleanedPhone,
          email: cleanedEmail,
          approved: false,
        },
      ]);

      if (insertError) {
        toast.error("تم إنشاء الحساب ولكن حدث خطأ في حفظ البيانات");
        return;
      }

      // 3. Sign out immediately to prevent auto-login
      await supabase.auth.signOut();

      toast.success("تم إنشاء الحساب بنجاح! في انتظار موافقة الإدارة");

      router.push("/login");
    } catch {
      toast.error("حدث خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-gray-100 py-8 px-4 sm:py-12">
      <div className="bg-white/80 backdrop-blur-sm p-6 sm:p-8 rounded-2xl shadow-xl w-full max-w-md sm:max-w-lg border border-gray-100">
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg mb-4">
            <span className="text-3xl" aria-hidden="true">
              🏫
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold">إنشاء حساب جديد</h1>
          <p className="text-sm text-gray-600 mt-2">
            ستحتاج إلى موافقة الإدارة بعد التسجيل
          </p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4" noValidate>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              name="nom"
              placeholder="الاسم"
              aria-label="الاسم"
              value={formData.nom}
              onChange={handleChange}
              className="p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-60 disabled:cursor-not-allowed"
              autoComplete="family-name"
              disabled={loading}
              required
            />
            <input
              name="prenom"
              placeholder="اللقب"
              aria-label="اللقب"
              value={formData.prenom}
              onChange={handleChange}
              className="p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-60 disabled:cursor-not-allowed"
              autoComplete="given-name"
              disabled={loading}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              name="matricule"
              placeholder="المعرف"
              aria-label="المعرف"
              value={formData.matricule}
              onChange={handleChange}
              className="p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-60 disabled:cursor-not-allowed"
              autoComplete="off"
              disabled={loading}
              required
            />
            <input
              name="phone"
              placeholder="رقم الهاتف"
              aria-label="رقم الهاتف"
              value={formData.phone}
              onChange={handleChange}
              className="p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-60 disabled:cursor-not-allowed"
              inputMode="numeric"
              autoComplete="tel"
              disabled={loading}
              required
            />
          </div>

          <input
            type="email"
            name="email"
            placeholder="البريد الإلكتروني"
            aria-label="البريد الإلكتروني"
            value={formData.email}
            onChange={handleChange}
            className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-60 disabled:cursor-not-allowed"
            dir="ltr"
            autoComplete="email"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck="false"
            disabled={loading}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              type="password"
              name="password"
              placeholder="كلمة المرور"
              aria-label="كلمة المرور"
              value={formData.password}
              onChange={handleChange}
              className="p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-60 disabled:cursor-not-allowed"
              dir="ltr"
              autoComplete="new-password"
              disabled={loading}
              required
            />
            <input
              type="password"
              name="confirmPassword"
              placeholder="تأكيد كلمة المرور"
              aria-label="تأكيد كلمة المرور"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-60 disabled:cursor-not-allowed"
              dir="ltr"
              autoComplete="new-password"
              disabled={loading}
              required
            />
          </div>

          <select
            name="role"
            aria-label="الدور"
            value={formData.role}
            onChange={handleChange}
            className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={loading}
          >
            <option value="teacher">👨‍🏫 أستاذ</option>
            <option value="admin">👨‍💼 إداري</option>
          </select>

          <button
            type="submit"
            disabled={loading}
            aria-busy={loading}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white p-3 rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Spinner />
                جاري إنشاء الحساب...
              </>
            ) : (
              "إنشاء حساب"
            )}
          </button>
        </form>

        <div className="text-center mt-6">
          <Link
            href="/login"
            className="text-green-600 hover:text-green-700 hover:underline"
          >
            لديك حساب؟ تسجيل الدخول
          </Link>
        </div>
      </div>
    </div>
  );
}