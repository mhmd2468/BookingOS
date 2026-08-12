"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthCallbackPage() {
  const router = useRouter();

  const [message, setMessage] = useState(
    "جاري تأكيد حسابك..."
  );

  useEffect(() => {
    let mounted = true;

    async function handleCallback() {
      try {
        /*
         * Supabase قد يرجع بيانات التأكيد داخل URL hash
         * مثل:
         * #access_token=...
         *
         * لذلك ننتظر تحميل الصفحة ثم نتحقق من الـ session.
         */

        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("Session error:", error);

          if (mounted) {
            setMessage(
              "حدث خطأ أثناء تأكيد البريد الإلكتروني. حاول فتح الرابط مرة أخرى."
            );
          }

          return;
        }

        /*
         * لو الجلسة موجودة، يبقى البريد اتأكد بنجاح.
         */

        if (session?.user) {
          if (mounted) {
            setMessage(
              "تم تأكيد بريدك الإلكتروني بنجاح 🎉"
            );
          }

          setTimeout(() => {
            router.replace("/welcome");
          }, 1500);

          return;
        }

        /*
         * أحيانًا Supabase يحتاج لحظة لمعالجة الـ hash
         * قبل أن تظهر الـ session.
         */

        await new Promise((resolve) =>
          setTimeout(resolve, 1000)
        );

        const {
          data: { session: secondSession },
        } = await supabase.auth.getSession();

        if (secondSession?.user) {
          if (mounted) {
            setMessage(
              "تم تأكيد بريدك الإلكتروني بنجاح 🎉"
            );
          }

          setTimeout(() => {
            router.replace("/welcome");
          }, 1500);

          return;
        }

        /*
         * لم نجد session
         */

        if (mounted) {
          setMessage(
            "تعذر تأكيد البريد الإلكتروني. حاول فتح رابط التأكيد مرة أخرى."
          );
        }
      } catch (error) {
        console.error("Auth callback error:", error);

        if (mounted) {
          setMessage(
            "حدث خطأ أثناء تأكيد الحساب. حاول مرة أخرى."
          );
        }
      }
    }

    handleCallback();

    return () => {
      mounted = false;
    };
  }, [router]);

  return (
    <main
      dir="rtl"
      className="flex min-h-screen items-center justify-center bg-slate-950 px-6"
    >
      <div className="w-full max-w-md text-center">
        {/* Loading / Success Icon */}

        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-blue-500/10">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-blue-500" />
        </div>

        {/* Logo */}

        <h1 className="mt-8 text-3xl font-bold text-white">
          Booking
          <span className="text-blue-500">OS</span>
        </h1>

        {/* Message */}

        <p className="mt-4 text-lg leading-8 text-slate-300">
          {message}
        </p>

        <p className="mt-3 text-sm text-slate-500">
          لحظات ونجهز لك حسابك...
        </p>
      </div>
    </main>
  );
}