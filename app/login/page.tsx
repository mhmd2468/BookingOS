"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const {
        data,
        error: loginError,
      } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (loginError || !data.user) {
        console.error(loginError);

        setError(
          "البريد الإلكتروني أو كلمة المرور غير صحيحة."
        );

        setLoading(false);
        return;
      }

      /*
       * المستخدم سجل الدخول بنجاح.
       *
       * الآن نتحقق هل عنده نشاط بالفعل أم لا.
       */

      const {
        data: business,
        error: businessError,
      } = await supabase
        .from("businesses")
        .select("id")
        .eq("owner_id", data.user.id)
        .maybeSingle();

      if (businessError) {
        console.error(businessError);

        setError(
          "تم تسجيل الدخول، لكن حدث خطأ أثناء التحقق من بيانات النشاط."
        );

        setLoading(false);
        return;
      }

      /*
       * إيقاف حالة التحميل قبل الانتقال.
       */

      setLoading(false);

      /*
       * حساب موجود لكن لم يتم إعداد النشاط بعد.
       *
       * نرسله مباشرة إلى صفحة إعداد النشاط.
       *
       * لا نعرض Welcome هنا لأن Welcome مخصصة
       * لأول مرة بعد تأكيد البريد الإلكتروني.
       */

      if (!business) {
        router.replace("/business");
        return;
      }

      /*
       * حساب قديم لديه نشاط بالفعل.
       *
       * يذهب مباشرة إلى Dashboard.
       */

      router.replace("/dashboard");
    } catch (error) {
      console.error("Login error:", error);

      setError(
        "حدث خطأ أثناء تسجيل الدخول. حاول مرة أخرى."
      );

      setLoading(false);
    }
  }

  return (
    <main
      dir="rtl"
      className="flex min-h-screen items-center justify-center bg-slate-950 px-6 py-12"
    >
      <div className="w-full max-w-md">
        {/* Header */}

        <div className="mb-8 text-center">
          <Link
            href="/"
            className="text-3xl font-bold tracking-tight text-white"
          >
            Booking
            <span className="text-blue-500">OS</span>
          </Link>

          <h1 className="mt-8 text-3xl font-bold text-white">
            تسجيل الدخول
          </h1>

          <p className="mt-3 text-slate-400">
            ادخل إلى حسابك وابدأ إدارة نشاطك بسهولة.
          </p>
        </div>

        {/* Login Card */}

        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
          <form
            onSubmit={handleLogin}
            className="space-y-5"
          >
            {/* Email */}

            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-slate-200"
              >
                البريد الإلكتروني
              </label>

              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                placeholder="name@example.com"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-left text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            {/* Password */}

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-slate-200"
              >
                كلمة المرور
              </label>

              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            {/* Error */}

            {error && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm leading-6 text-red-300">
                {error}
              </div>
            )}

            {/* Submit */}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-blue-600 px-5 py-3.5 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? "جاري التحقق من الحساب..."
                : "تسجيل الدخول"}
            </button>
          </form>

          {/* Register */}

          <div className="mt-6 border-t border-slate-800 pt-6 text-center text-sm text-slate-400">
            لسه معندكش حساب؟{" "}
            <Link
              href="/register"
              className="font-semibold text-blue-400 transition hover:text-blue-300"
            >
              إنشاء حساب
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}