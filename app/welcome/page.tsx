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
        <div className="absolute -right-40 -top-40 h-[500px] w-[500px] rounded-full bg-blue-600/10 blur-3xl" />

        <div className="absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full bg-indigo-600/10 blur-3xl" />

        <div className="absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500/5 blur-3xl" />
      </div>

      {/* Header */}

      <header className="relative z-10 border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-10">
          <div>
            <div className="text-2xl font-bold tracking-tight">
              Booking
              <span className="text-blue-500">OS</span>
            </div>

            <p className="mt-1 text-xs text-slate-500">
              Smart Booking Platform
            </p>
          </div>

          <div className="hidden rounded-full border border-slate-800 bg-slate-900/70 px-4 py-2 text-xs font-medium text-slate-400 sm:block">
            مرحبًا بك في BookingOS 👋
          </div>
        </div>
      </header>

      {/* Main */}

      <div className="relative z-10 mx-auto max-w-7xl px-6 py-10 lg:px-10 lg:py-16">
        <div className="grid items-center gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
          {/* Image Side */}

          <div className="order-1 lg:order-1">
            <div className="relative mx-auto max-w-md">
              {/* Glow */}

              <div className="absolute -inset-5 rounded-[2.5rem] bg-blue-600/10 blur-2xl" />

              {/* Image Card */}

              <div className="relative overflow-hidden rounded-[2.5rem] border border-slate-800 bg-slate-900 p-3 shadow-2xl">
                <div className="relative overflow-hidden rounded-[2rem] bg-slate-800">
                  <Image
                    src="/profile.jpg"
                    alt="Mohamed Rabie"
                    width={700}
                    height={900}
                    priority
                    className="h-auto w-full object-contain"
                  />

                  {/* Bottom gradient */}

                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent px-6 pb-6 pt-20">
                    <p className="text-sm font-medium text-blue-400">
                      Founder & Developer
                    </p>

                    <h2 className="mt-1 text-2xl font-bold text-white">
                      Mohamed Rabie
                    </h2>
                  </div>
                </div>
              </div>

              {/* Floating Badge */}

              <div className="absolute -bottom-5 -left-5 hidden rounded-2xl border border-slate-700 bg-slate-900/95 px-5 py-4 shadow-2xl sm:block">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/10 text-xl">
                    🚀
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">
                      Built by
                    </p>

                    <p className="text-sm font-bold text-white">
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

              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-xs font-bold text-blue-400">
                <span className="h-2 w-2 rounded-full bg-blue-500" />

                تم تأكيد بريدك الإلكتروني بنجاح
              </div>

              {/* Welcome */}

              <p className="text-sm font-bold text-blue-400">
                أهلاً وسهلاً بيك 👋
              </p>

              <h1 className="mt-4 text-4xl font-black leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                أهلاً بيك في{" "}
                <span className="text-blue-500">
                  BookingOS
                </span>
              </h1>

              <p className="mt-6 text-xl font-semibold leading-9 text-slate-200">
                {name}، حسابك اتعمل بنجاح 🎉
              </p>

              <p className="mt-5 max-w-xl text-base leading-8 text-slate-400">
                أنت دلوقتي على أول خطوة في طريق تحويل
                نشاطك لنظام حجز وإدارة احترافي يساعدك
                تستقبل حجوزاتك وتنظم مواعيدك وتدير
                عملاءك بسهولة من مكان واحد.
              </p>

              {/* About BookingOS */}

              <div className="mt-8 rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl backdrop-blur">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600/10 text-2xl">
                    💡
                  </div>

                  <div>
                    <h2 className="text-lg font-bold text-white">
                      إيه هو BookingOS؟
                    </h2>

                    <p className="mt-2 text-sm leading-7 text-slate-400">
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

              <div className="mt-4 rounded-3xl border border-slate-800 bg-slate-900/50 p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-800 text-xl">
                    👨‍💻
                  </div>

                  <div>
                    <h2 className="text-lg font-bold text-white">
                      مين اللي عمل BookingOS؟
                    </h2>

                    <p className="mt-2 text-sm leading-7 text-slate-400">
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

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
                  <div className="text-2xl">📅</div>

                  <p className="mt-3 text-sm font-bold text-white">
                    إدارة الحجوزات
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    نظم مواعيد عملائك بسهولة.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
                  <div className="text-2xl">🔗</div>

                  <p className="mt-3 text-sm font-bold text-white">
                    رابط حجز خاص
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    شارك رابط نشاطك مع عملائك.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
                  <div className="text-2xl">📱</div>

                  <p className="mt-3 text-sm font-bold text-white">
                    QR Code
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    خلي الحجز أسهل بمجرد مسح الكود.
                  </p>
                </div>
              </div>

              {/* CTA */}

              <div className="mt-8">
                <button
                  type="button"
                  onClick={startSetup}
                  className="group w-full rounded-2xl bg-blue-600 px-6 py-4 text-base font-bold text-white shadow-xl shadow-blue-600/20 transition hover:bg-blue-700 hover:shadow-blue-600/30 sm:w-auto sm:min-w-[280px]"
                >
                  ابدأ إعداد نشاطك

                  <span className="mr-3 inline-block transition-transform group-hover:-translate-x-1">
                    ←
                  </span>
                </button>

                <p className="mt-4 text-xs text-slate-600">
                  إعداد نشاطك يستغرق أقل من دقيقة.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}

      <footer className="relative z-10 border-t border-slate-800/70">
        <div className="mx-auto max-w-7xl px-6 py-6 text-center lg:px-10">
          <p className="text-xs text-slate-600">
            © 2026 BookingOS — Built with passion by{" "}
            <span className="text-slate-500">
              Mohamed Rabie
            </span>
          </p>
        </div>
      </footer>
    </main>
  );
}