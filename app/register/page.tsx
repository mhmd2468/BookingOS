"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Step = "register" | "verify";

export default function RegisterPage() {
  const router = useRouter();

  const [step, setStep] = useState<Step>("register");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [otp, setOtp] = useState("");

  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // =========================
  // إرسال كود التحقق
  // =========================

  async function handleRegister(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setMessage("");

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setError("اكتب البريد الإلكتروني.");
      return;
    }

    if (password !== confirmPassword) {
      setError("كلمتا المرور غير متطابقتين.");
      return;
    }

    if (password.length < 6) {
      setError("كلمة المرور يجب أن تكون 6 أحرف على الأقل.");
      return;
    }

    setLoading(true);

    const { error: otpError } =
      await supabase.auth.signInWithOtp({
        email: cleanEmail,
        options: {
          shouldCreateUser: true,
        },
      });

    setLoading(false);

    if (otpError) {
      console.error("OTP SEND ERROR:", otpError);

      setError(
        "لم نتمكن من إرسال كود التحقق. حاول مرة أخرى."
      );

      return;
    }

    setEmail(cleanEmail);
    setStep("verify");

    setMessage(
      "تم إرسال كود التحقق إلى بريدك الإلكتروني 📩"
    );
  }

  // =========================
  // التحقق من الكود
  // =========================

  async function handleVerify(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setMessage("");

    const cleanOtp = otp.trim();

    // Supabase عندك يرسل 8 أرقام
    if (!/^\d{8}$/.test(cleanOtp)) {
      setError(
        "اكتب كود التحقق المكون من 8 أرقام."
      );
      return;
    }

    setLoading(true);

    const {
      data,
      error: verifyError,
    } = await supabase.auth.verifyOtp({
      email,
      token: cleanOtp,
      type: "email",
    });

    if (verifyError) {
      console.error(
        "OTP VERIFY ERROR:",
        verifyError
      );

      setLoading(false);

      setError(
        "كود التحقق غير صحيح أو انتهت صلاحيته."
      );

      return;
    }

    // =========================
    // حفظ كلمة المرور
    // =========================

    const { error: passwordError } =
      await supabase.auth.updateUser({
        password,
      });

    if (passwordError) {
      console.error(
        "PASSWORD UPDATE ERROR:",
        passwordError
      );

      setLoading(false);

      setError(
        "تم تأكيد البريد، لكن حدث خطأ أثناء حفظ كلمة المرور."
      );

      return;
    }

    console.log(
      "REGISTERED USER:",
      data.user?.email
    );

    setMessage(
      "تم تأكيد بريدك وإنشاء حسابك بنجاح 🎉"
    );

    setLoading(false);

    // الانتقال إلى صفحة Welcome الموجودة بالفعل
    router.push("/welcome");
    router.refresh();
  }

  // =========================
  // إعادة إرسال الكود
  // =========================

  async function handleResendCode() {
    setError("");
    setMessage("");

    if (!email) {
      setError(
        "لا يوجد بريد إلكتروني لإعادة إرسال الكود."
      );
      return;
    }

    setResending(true);

    const { error: resendError } =
      await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
        },
      });

    setResending(false);

    if (resendError) {
      console.error(
        "RESEND OTP ERROR:",
        resendError
      );

      setError(
        "لم نتمكن من إعادة إرسال الكود. حاول بعد قليل."
      );

      return;
    }

    setMessage(
      "تم إرسال كود جديد إلى بريدك الإلكتروني 📩"
    );
  }

  // =========================
  // تغيير البريد
  // =========================

  function goBackToRegister() {
    setStep("register");
    setOtp("");
    setError("");
    setMessage("");
  }

  return (
    <main
      dir="rtl"
      className="flex min-h-screen items-center justify-center bg-slate-950 px-6 py-12"
    >
      <div className="w-full max-w-md">

        {/* Logo */}

        <div className="mb-8 text-center">
          <Link
            href="/"
            className="text-3xl font-bold tracking-tight text-white"
          >
            Booking
            <span className="text-blue-500">
              OS
            </span>
          </Link>

          <h1 className="mt-8 text-3xl font-bold text-white">
            {step === "register"
              ? "أنشئ حسابك"
              : "تأكيد بريدك الإلكتروني"}
          </h1>

          <p className="mt-3 text-slate-400">
            {step === "register"
              ? "ابدأ بإدارة نشاطك وحجوزاتك من مكان واحد."
              : "أرسلنا لك كود تحقق مكون من 8 أرقام."}
          </p>
        </div>

        {/* Card */}

        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">

          {step === "register" ? (
            <form
              onSubmit={handleRegister}
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
                  minLength={6}
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              {/* Confirm Password */}

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="mb-2 block text-sm font-medium text-slate-200"
                >
                  تأكيد كلمة المرور
                </label>

                <input
                  id="confirmPassword"
                  type="password"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) =>
                    setConfirmPassword(
                      event.target.value
                    )
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

              {/* Message */}

              {message && (
                <div className="rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm leading-6 text-green-300">
                  {message}
                </div>
              )}

              {/* Button */}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-blue-600 px-5 py-3.5 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading
                  ? "جاري إرسال الكود..."
                  : "إرسال كود التحقق"}
              </button>
            </form>
          ) : (
            <form
              onSubmit={handleVerify}
              className="space-y-5"
            >

              {/* Email */}

              <div className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-4">
                <p className="text-xs text-slate-500">
                  تم إرسال الكود إلى
                </p>

                <p className="mt-1 break-all text-sm font-semibold text-white">
                  {email}
                </p>
              </div>

              {/* OTP */}

              <div>
                <label
                  htmlFor="otp"
                  className="mb-2 block text-sm font-medium text-slate-200"
                >
                  كود التحقق
                </label>

                <input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={8}
                  required
                  value={otp}
                  onChange={(event) => {
                    const value =
                      event.target.value.replace(
                        /\D/g,
                        ""
                      );

                    setOtp(
                      value.slice(0, 8)
                    );
                  }}
                  placeholder="00000000"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-4 text-center text-2xl font-bold tracking-[0.4em] text-white outline-none transition placeholder:text-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              {/* Error */}

              {error && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm leading-6 text-red-300">
                  {error}
                </div>
              )}

              {/* Message */}

              {message && (
                <div className="rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm leading-6 text-green-300">
                  {message}
                </div>
              )}

              {/* Verify */}

              <button
                type="submit"
                disabled={
                  loading ||
                  otp.length !== 8
                }
                className="w-full rounded-xl bg-blue-600 px-5 py-3.5 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading
                  ? "جاري تأكيد البريد..."
                  : "تأكيد البريد وإنشاء الحساب"}
              </button>

              {/* Resend */}

              <button
                type="button"
                onClick={handleResendCode}
                disabled={resending}
                className="w-full rounded-xl border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-300 transition hover:border-blue-500 hover:text-blue-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {resending
                  ? "جاري إعادة الإرسال..."
                  : "إعادة إرسال الكود"}
              </button>

              {/* Change Email */}

              <button
                type="button"
                onClick={goBackToRegister}
                className="w-full text-sm text-slate-500 transition hover:text-slate-300"
              >
                تغيير البريد الإلكتروني
              </button>
            </form>
          )}

          {/* Login */}

          <div className="mt-6 border-t border-slate-800 pt-6 text-center text-sm text-slate-400">
            عندك حساب بالفعل؟{" "}

            <Link
              href="/login"
              className="font-semibold text-blue-400 transition hover:text-blue-300"
            >
              تسجيل الدخول
            </Link>
          </div>
        </div>

        {/* Footer */}

        <p className="mt-6 text-center text-xs leading-5 text-slate-500">
          بإنشاء الحساب، أنت توافق على شروط استخدام BookingOS.
        </p>
      </div>
    </main>
  );
}