"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabase";

export default function WelcomePage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      setName(
        user.user_metadata?.full_name ||
          user.email?.split("@")[0] ||
          "صديقي"
      );

      setLoading(false);
    }

    loadUser();
  }, [router]);

  function startSetup() {
    router.push("/business");
  }

  if (loading) {
    return (
      <main
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-slate-950"
      >
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-blue-500" />

          <p className="mt-4 text-sm text-slate-400">
            جاري تجهيز حسابك...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main
      dir="rtl"
      className="relative min-h-screen overflow-hidden bg-slate-950 text-white"
    >
      {/* Background */}

      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -right-40 -top-40 h-[400px] w-[400px] rounded-full bg-blue-600/10 blur-3xl" />

        <div className="absolute -bottom-40 -left-40 h-[400px] w-[400px] rounded-full bg-indigo-600/10 blur-3xl" />

        <div className="absolute left-1/2 top-1/2 h-[350px] w-[350px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500/5 blur-3xl" />
      </div>

      {/* Header */}

      <header className="relative z-10 border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-10 lg:py-5">
          <div>
            <div className="text-xl font-bold tracking-tight sm:text-2xl">
              Booking
              <span className="text-blue-500">OS</span>
            </div>

            <p className="mt-0.5 text-[10px] text-slate-500 sm:text-xs">
              Smart Booking Platform
            </p>
          </div>

          <div className="hidden rounded-full border border-slate-800 bg-slate-900/70 px-4 py-2 text-xs font-medium text-slate-400 sm:block">
            مرحبًا بك في BookingOS 👋
          </div>
        </div>
      </header>

      {/* Main */}

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10 lg:px-10 lg:py-16">
        <div className="grid items-center gap-7 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">

          {/* Image Side */}

          <div className="order-1">
            <div className="relative mx-auto max-w-[310px] sm:max-w-md">

              {/* Glow */}

              <div className="absolute -inset-4 rounded-[2.5rem] bg-blue-600/10 blur-2xl" />

              {/* Image Card */}

              <div className="relative overflow-hidden rounded-[2.5rem] border border-slate-800 bg-slate-900 p-2.5 sm:p-3 shadow-2xl">
                <div className="relative overflow-hidden rounded-[2rem] bg-slate-800">

                  {/* الصورة كما هي بدون قص */}

                  <Image
                    src="/profile.jpg"
                    alt="Mohamed Rabie"
                    width={700}
                    height={900}
                    priority
                    className="h-auto w-full object-contain"
                  />

                  {/* Bottom gradient */}

                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent px-5 pb-5 pt-16 sm:px-6 sm:pb-6 sm:pt-20">
                    <p className="text-xs font-medium text-blue-400 sm:text-sm">
                      Founder & Developer
                    </p>

                    <h2 className="mt-1 text-xl font-bold text-white sm:text-2xl">
                      Mohamed Rabie
                    </h2>
                  </div>
                </div>
              </div>

              {/* Floating Badge */}

              <div className="absolute -bottom-4 -left-4 hidden rounded-2xl border border-slate-700 bg-slate-900/95 px-4 py-3 shadow-2xl sm:block">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600/10 text-lg">
                    🚀
                  </div>

                  <div>
                    <p className="text-[10px] text-slate-500">
                      Built by
                    </p>

                    <p className="text-xs font-bold text-white">
                      Mohamed Rabie
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Content Side */}

          <div className="order-2">
            <div className="max-w-2xl">

              {/* Small badge */}

              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1.5 text-[11px] font-bold text-blue-400 sm:mb-6 sm:px-4 sm:py-2 sm:text-xs">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500 sm:h-2 sm:w-2" />

                تم تأكيد بريدك الإلكتروني بنجاح
              </div>

              {/* Welcome */}

              <p className="text-xs font-bold text-blue-400 sm:text-sm">
                أهلاً وسهلاً بيك 👋
              </p>

              <h1 className="mt-2 text-3xl font-black leading-tight tracking-tight sm:mt-4 sm:text-5xl lg:text-6xl">
                أهلاً بيك في{" "}
                <span className="text-blue-500">
                  BookingOS
                </span>
              </h1>

              <p className="mt-3 text-lg font-semibold leading-8 text-slate-200 sm:mt-6 sm:text-xl sm:leading-9">
                {name}، حسابك اتعمل بنجاح 🎉
              </p>

              <p className="mt-3 text-sm leading-7 text-slate-400 sm:mt-5 sm:text-base sm:leading-8">
                أنت دلوقتي على أول خطوة في طريق تحويل
                نشاطك لنظام حجز وإدارة احترافي يساعدك
                تستقبل حجوزاتك وتنظم مواعيدك وتدير
                عملاءك بسهولة من مكان واحد.
              </p>

              {/* About BookingOS */}

              <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-xl backdrop-blur sm:mt-8 sm:rounded-3xl sm:p-6">
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600/10 text-xl sm:h-12 sm:w-12 sm:rounded-2xl sm:text-2xl">
                    💡
                  </div>

                  <div>
                    <h2 className="text-base font-bold text-white sm:text-lg">
                      إيه هو BookingOS؟
                    </h2>

                    <p className="mt-1.5 text-xs leading-6 text-slate-400 sm:mt-2 sm:text-sm sm:leading-7">
                      BookingOS هو نظام لإدارة الحجوزات
                      مصمم لأصحاب الأنشطة المختلفة، سواء
                      عيادة أو صالون أو مركز تجميل أو ملعب
                      أو مدرب أو مدرس أو أي نشاط يعتمد على
                      المواعيد والحجوزات.
                    </p>
                  </div>
                </div>
              </div>

              {/* Founder */}

              <div className="mt-3 rounded-2xl border border-slate-800 bg-slate-900/50 p-4 sm:mt-4 sm:rounded-3xl sm:p-6">
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-lg sm:h-12 sm:w-12 sm:rounded-2xl sm:text-xl">
                    👨‍💻
                  </div>

                  <div>
                    <h2 className="text-base font-bold text-white sm:text-lg">
                      مين اللي عمل BookingOS؟
                    </h2>

                    <p className="mt-1.5 text-xs leading-6 text-slate-400 sm:mt-2 sm:text-sm sm:leading-7">
                      BookingOS تم تصميمه وتطويره بواسطة{" "}
                      <span className="font-semibold text-blue-400">
                        Mohamed Rabie
                      </span>
                      ، بهدف تقديم طريقة بسيطة وحديثة
                      تساعد أصحاب الأنشطة على إدارة الحجوزات
                      بدون تعقيد.
                    </p>
                  </div>
                </div>
              </div>

              {/* Features */}

              <div className="mt-4 grid grid-cols-3 gap-2 sm:mt-6 sm:gap-3">

                <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3 sm:rounded-2xl sm:p-4">
                  <div className="text-xl sm:text-2xl">
                    📅
                  </div>

                  <p className="mt-2 text-[11px] font-bold text-white sm:mt-3 sm:text-sm">
                    إدارة الحجوزات
                  </p>

                  <p className="mt-1 hidden text-xs leading-5 text-slate-500 sm:block">
                    نظم مواعيد عملائك بسهولة.
                  </p>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3 sm:rounded-2xl sm:p-4">
                  <div className="text-xl sm:text-2xl">
                    🔗
                  </div>

                  <p className="mt-2 text-[11px] font-bold text-white sm:mt-3 sm:text-sm">
                    رابط حجز خاص
                  </p>

                  <p className="mt-1 hidden text-xs leading-5 text-slate-500 sm:block">
                    شارك رابط نشاطك مع عملائك.
                  </p>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3 sm:rounded-2xl sm:p-4">
                  <div className="text-xl sm:text-2xl">
                    📱
                  </div>

                  <p className="mt-2 text-[11px] font-bold text-white sm:mt-3 sm:text-sm">
                    QR Code
                  </p>

                  <p className="mt-1 hidden text-xs leading-5 text-slate-500 sm:block">
                    خلي الحجز أسهل بمجرد مسح الكود.
                  </p>
                </div>

              </div>

              {/* CTA */}

              <div className="mt-5 sm:mt-8">
                <button
                  type="button"
                  onClick={startSetup}
                  className="group w-full rounded-2xl bg-blue-600 px-6 py-3.5 text-sm font-bold text-white shadow-xl shadow-blue-600/20 transition hover:bg-blue-700 hover:shadow-blue-600/30 sm:w-auto sm:min-w-[280px] sm:py-4 sm:text-base"
                >
                  ابدأ إعداد نشاطك

                  <span className="mr-3 inline-block transition-transform group-hover:-translate-x-1">
                    ←
                  </span>
                </button>

                <p className="mt-2 text-[10px] text-slate-600 sm:mt-4 sm:text-xs">
                  إعداد نشاطك يستغرق أقل من دقيقة.
                </p>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* Footer */}

      <footer className="relative z-10 border-t border-slate-800/70">
        <div className="mx-auto max-w-7xl px-4 py-4 text-center sm:px-6 sm:py-6 lg:px-10">
          <p className="text-[10px] text-slate-600 sm:text-xs">
            ©️ 2026 BookingOS — Built with passion by{" "}
            <span className="text-slate-500">
              Mohamed Rabie
            </span>
          </p>
        </div>
      </footer>
    </main>
  );
}