"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const router = useRouter();

  async function handleStart() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      router.push("/dashboard");
    } else {
      router.push("/login");
    }
  }

  function handleDiscover() {
    document
      .getElementById("features")
      ?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-white text-slate-900"
    >
      {/* Navigation */}
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-8">
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="text-2xl font-bold tracking-tight"
        >
          Booking<span className="text-blue-600">OS</span>
        </button>

        <div className="hidden items-center gap-8 text-sm font-medium md:flex">
          <a
            href="#features"
            className="transition hover:text-blue-600"
          >
            المميزات
          </a>

          <a
            href="#how-it-works"
            className="transition hover:text-blue-600"
          >
            كيف يعمل؟
          </a>

          <a
            href="#contact"
            className="transition hover:text-blue-600"
          >
            تواصل معنا
          </a>
        </div>

        <button
          type="button"
          onClick={handleStart}
          className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          ابدأ الآن
        </button>
      </nav>

      {/* Hero */}
      <section className="mx-auto flex max-w-7xl flex-col items-center px-6 pb-24 pt-20 text-center lg:px-8">
        <div className="mb-6 rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700">
          نظام حجز ذكي لنشاطك التجاري
        </div>

        <h1 className="max-w-4xl text-4xl font-bold tracking-tight sm:text-6xl">
          خلّي إدارة الحجوزات
          <span className="block text-blue-600">
            أسهل وأذكى
          </span>
        </h1>

        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
          BookingOS يساعدك على إدارة خدماتك ومواعيدك وحجوزات عملائك
          من مكان واحد، بطريقة بسيطة واحترافية.
        </p>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <button
            type="button"
            onClick={handleStart}
            className="rounded-xl bg-blue-600 px-7 py-3.5 font-semibold text-white transition hover:bg-blue-700"
          >
            ابدأ مجانًا
          </button>

          <button
            type="button"
            onClick={handleDiscover}
            className="rounded-xl border border-slate-200 bg-white px-7 py-3.5 font-semibold text-slate-900 transition hover:bg-slate-50"
          >
            اكتشف BookingOS
          </button>
        </div>
      </section>

      {/* Features */}
      <section
        id="features"
        className="border-y border-slate-100 bg-slate-50 px-6 py-20 lg:px-8"
      >
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              كل ما تحتاجه لإدارة حجوزاتك
            </h2>

            <p className="mt-4 text-slate-600">
              أدوات بسيطة تساعدك على تنظيم نشاطك وتوفير وقتك.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
              <div className="mb-5 text-3xl">📅</div>

              <h3 className="text-xl font-bold">
                إدارة المواعيد
              </h3>

              <p className="mt-3 leading-7 text-slate-600">
                نظم مواعيدك وحدد الأوقات المتاحة بدون تعقيد.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
              <div className="mb-5 text-3xl">👥</div>

              <h3 className="text-xl font-bold">
                إدارة العملاء
              </h3>

              <p className="mt-3 leading-7 text-slate-600">
                احتفظ ببيانات الحجوزات والعملاء في مكان واحد.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
              <div className="mb-5 text-3xl">📊</div>

              <h3 className="text-xl font-bold">
                لوحة تحكم كاملة
              </h3>

              <p className="mt-3 leading-7 text-slate-600">
                تابع نشاطك وحجوزاتك من Dashboard واحدة.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section
        id="how-it-works"
        className="mx-auto max-w-7xl px-6 py-20 lg:px-8"
      >
        <div className="grid gap-12 md:grid-cols-3">
          <div>
            <span className="text-sm font-bold text-blue-600">
              01
            </span>

            <h3 className="mt-2 text-xl font-bold">
              أنشئ حسابك
            </h3>

            <p className="mt-3 text-slate-600">
              سجّل نشاطك وأضف بياناتك الأساسية.
            </p>
          </div>

          <div>
            <span className="text-sm font-bold text-blue-600">
              02
            </span>

            <h3 className="mt-2 text-xl font-bold">
              أضف خدماتك
            </h3>

            <p className="mt-3 text-slate-600">
              أضف الخدمات والأسعار ومواعيد العمل.
            </p>
          </div>

          <div>
            <span className="text-sm font-bold text-blue-600">
              03
            </span>

            <h3 className="mt-2 text-xl font-bold">
              استقبل الحجوزات
            </h3>

            <p className="mt-3 text-slate-600">
              شارك رابط نشاطك وابدأ استقبال الحجوزات.
            </p>
          </div>
        </div>
      </section>

      {/* Contact */}
      <footer
        id="contact"
        className="border-t border-slate-100 bg-slate-50 px-6 py-14 lg:px-8"
      >
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 md:grid-cols-2">
            <div>
              <div className="text-2xl font-bold tracking-tight">
                Booking<span className="text-blue-600">OS</span>
              </div>

              <h2 className="mt-4 text-2xl font-bold text-slate-900">
                محتاج تعرف أكتر عن BookingOS؟
              </h2>

              <p className="mt-3 max-w-md leading-7 text-slate-600">
                تواصل معانا لو عندك أي سؤال أو حابب تعرف إزاي
                BookingOS ممكن يساعد نشاطك في إدارة الحجوزات.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900">
                تواصل معنا
              </h3>

              <div className="mt-5 space-y-4">
                <a
                  href="tel:01064028625"
                  className="flex items-center gap-3 text-slate-700 transition hover:text-blue-600"
                >
                  <span className="text-xl">📱</span>
                  <span>01064028625</span>
                </a>

                <a
                  href="mailto:Mohamedrapie89@gmail.com"
                  className="flex items-center gap-3 text-slate-700 transition hover:text-blue-600"
                >
                  <span className="text-xl">✉️</span>
                  <span>Mohamedrapie89@gmail.com</span>
                </a>

                <div className="flex items-center gap-3 text-slate-700">
                  <span className="text-xl">👤</span>
                  <span>Mohamed Rapie</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 border-t border-slate-200 pt-6 text-center text-sm text-slate-500">
            ©️ 2026 BookingOS — جميع الحقوق محفوظة
          </div>
        </div>
      </footer>
    </main>
  );
}