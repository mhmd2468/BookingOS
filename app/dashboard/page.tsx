"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type UserData = {
  email?: string;
};

type Booking = {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  booking_date: string;
  booking_time: string;
  status: string;
  notes: string | null;
  created_at: string;
  service_id: string;
};

type Service = {
  id: string;
  name: string;
};

export default function DashboardPage() {
  const router = useRouter();

  const [user, setUser] = useState<UserData | null>(null);

  const [businessId, setBusinessId] = useState("");
  const [businessName, setBusinessName] = useState("");

  const [servicesCount, setServicesCount] = useState(0);
  const [customersCount, setCustomersCount] = useState(0);
  const [todayBookingsCount, setTodayBookingsCount] = useState(0);
  const [totalBookingsCount, setTotalBookingsCount] = useState(0);

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [services, setServices] = useState<Service[]>([]);

  const [loading, setLoading] = useState(true);
  const [bookingActionId, setBookingActionId] = useState<string | null>(
    null
  );

  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    setLoading(true);
    setError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.replace("/login");
      return;
    }

    setUser({
      email: user.email,
    });

    const { data: business, error: businessError } = await supabase
      .from("businesses")
      .select("id, name")
      .eq("owner_id", user.id)
      .maybeSingle();

    if (businessError) {
      console.error(businessError);
      setError("حدث خطأ أثناء تحميل بيانات النشاط.");
      setLoading(false);
      return;
    }

    if (!business) {
      setLoading(false);
      return;
    }

    setBusinessId(business.id);
    setBusinessName(business.name ?? "");

    const { data: servicesData, error: servicesError } = await supabase
      .from("services")
      .select("id, name")
      .eq("business_id", business.id)
      .order("created_at", {
        ascending: true,
      });

    if (!servicesError) {
      setServices(servicesData ?? []);
      setServicesCount(servicesData?.length ?? 0);
    }

    const { data: bookingsData, error: bookingsError } = await supabase
      .from("bookings")
      .select(
        `
          id,
          customer_name,
          customer_phone,
          customer_email,
          booking_date,
          booking_time,
          status,
          notes,
          created_at,
          service_id
        `
      )
      .eq("business_id", business.id)
      .order("booking_date", {
        ascending: true,
      })
      .order("booking_time", {
        ascending: true,
      });

    if (bookingsError) {
      console.error(bookingsError);
      setError("حدث خطأ أثناء تحميل الحجوزات.");
      setLoading(false);
      return;
    }

    const allBookings = bookingsData ?? [];

    setBookings(allBookings);

    setTotalBookingsCount(allBookings.length);

    const now = new Date();

    const today =
      now.getFullYear() +
      "-" +
      String(now.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(now.getDate()).padStart(2, "0");

    const todayBookings = allBookings.filter(
      (booking) => booking.booking_date === today
    );

    setTodayBookingsCount(todayBookings.length);

    const uniqueCustomers = new Set(
      allBookings
        .map((booking) => booking.customer_phone?.trim())
        .filter(Boolean)
    );

    setCustomersCount(uniqueCustomers.size);

    setLoading(false);
  }

  // =========================
  // Public Booking Link
  // =========================

  function getBookingUrl() {
    if (typeof window === "undefined" || !businessId) {
      return "";
    }

    return `${window.location.origin}/book/${businessId}`;
  }

  async function copyBookingLink() {
    const bookingUrl = getBookingUrl();

    if (!bookingUrl) return;

    try {
      await navigator.clipboard.writeText(bookingUrl);

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error(error);
      setError("لم نتمكن من نسخ الرابط.");
    }
  }

  function openBookingPage() {
    const bookingUrl = getBookingUrl();

    if (!bookingUrl) return;

    window.open(bookingUrl, "_blank");
  }

  async function shareBookingLink() {
    const bookingUrl = getBookingUrl();

    if (!bookingUrl) return;

    const shareData = {
      title: `احجز موعدك مع ${businessName || "نشاطنا"}`,
      text: `يمكنك حجز موعدك أونلاين مع ${
        businessName || "نشاطنا"
      } من خلال الرابط التالي:`,
      url: bookingUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (error) {
        if ((error as Error).name === "AbortError") {
          return;
        }
      }
    }

    await copyBookingLink();
  }

  async function updateBookingStatus(
    bookingId: string,
    status: "confirmed" | "cancelled"
  ) {
    setBookingActionId(bookingId);
    setError("");

    const { error } = await supabase
      .from("bookings")
      .update({
        status,
      })
      .eq("id", bookingId)
      .eq("business_id", businessId);

    if (error) {
      console.error(error);
      setError("لم نتمكن من تحديث حالة الحجز.");
      setBookingActionId(null);
      return;
    }

    setBookings((currentBookings) =>
      currentBookings.map((booking) =>
        booking.id === bookingId
          ? {
              ...booking,
              status,
            }
          : booking
      )
    );

    setBookingActionId(null);
  }

  async function deleteBooking(bookingId: string) {
    const confirmed = window.confirm(
      "هل أنت متأكد أنك تريد حذف هذا الحجز؟"
    );

    if (!confirmed) return;

    setBookingActionId(bookingId);
    setError("");

    const { error } = await supabase
      .from("bookings")
      .delete()
      .eq("id", bookingId)
      .eq("business_id", businessId);

    if (error) {
      console.error(error);
      setError("لم نتمكن من حذف الحجز.");
      setBookingActionId(null);
      return;
    }

    const remainingBookings = bookings.filter(
      (booking) => booking.id !== bookingId
    );

    setBookings(remainingBookings);

    setTotalBookingsCount(remainingBookings.length);

    const now = new Date();

    const today =
      now.getFullYear() +
      "-" +
      String(now.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(now.getDate()).padStart(2, "0");

    setTodayBookingsCount(
      remainingBookings.filter(
        (booking) => booking.booking_date === today
      ).length
    );

    const uniqueCustomers = new Set(
      remainingBookings
        .map((booking) => booking.customer_phone?.trim())
        .filter(Boolean)
    );

    setCustomersCount(uniqueCustomers.size);

    setBookingActionId(null);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  function getServiceName(serviceId: string) {
    return (
      services.find((service) => service.id === serviceId)?.name ??
      "خدمة"
    );
  }

  function getStatusLabel(status: string) {
    switch (status) {
      case "confirmed":
        return "مؤكد";

      case "cancelled":
        return "ملغي";

      case "completed":
        return "مكتمل";

      case "pending":
      default:
        return "قيد الانتظار";
    }
  }

  function getStatusClass(status: string) {
    switch (status) {
      case "confirmed":
        return "bg-green-50 text-green-700 border-green-200";

      case "cancelled":
        return "bg-red-50 text-red-700 border-red-200";

      case "completed":
        return "bg-blue-50 text-blue-700 border-blue-200";

      case "pending":
      default:
        return "bg-amber-50 text-amber-700 border-amber-200";
    }
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
            جاري تحميل لوحة التحكم...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-slate-100 text-slate-900"
    >
      <aside className="fixed right-0 top-0 hidden h-screen w-64 border-l border-slate-200 bg-white lg:block">
        <div className="flex h-full flex-col">
          <div className="border-b border-slate-100 px-6 py-6">
            <div className="text-2xl font-bold tracking-tight">
              Booking<span className="text-blue-600">OS</span>
            </div>

            <p className="mt-1 text-xs text-slate-400">
              لوحة إدارة نشاطك
            </p>
          </div>

          <nav className="flex-1 space-y-2 px-4 py-6">
            <a
              href="/dashboard"
              className="flex items-center gap-3 rounded-xl bg-blue-50 px-4 py-3 font-semibold text-blue-600"
            >
              <span>📊</span>
              <span>نظرة عامة</span>
            </a>

            <a
              href="#bookings"
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-slate-600 transition hover:bg-slate-50"
            >
              <span>📅</span>
              <span>الحجوزات</span>
            </a>

            <a
              href="#customers"
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-slate-600 transition hover:bg-slate-50"
            >
              <span>👥</span>
              <span>العملاء</span>
            </a>

            <a
              href="/services"
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-slate-600 transition hover:bg-slate-50"
            >
              <span>🛎️</span>
              <span>الخدمات</span>
            </a>

            <a
              href="/business"
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-slate-600 transition hover:bg-slate-50"
            >
              <span>⚙️</span>
              <span>إعداد النشاط</span>
            </a>
          </nav>

          <div className="border-t border-slate-100 p-4">
            <div className="mb-3 rounded-xl bg-slate-50 px-4 py-3">
              <p className="truncate text-sm font-medium text-slate-900">
                {user?.email}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                صاحب النشاط
              </p>
            </div>

            <button
              onClick={handleLogout}
              className="w-full rounded-xl px-4 py-3 text-sm font-semibold text-red-500 transition hover:bg-red-50"
            >
              تسجيل الخروج
            </button>
          </div>
        </div>
      </aside>

      <div className="lg:mr-64">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-8">
            <div>
              <p className="text-sm text-slate-400">
                مرحبًا بك 👋
              </p>

              <h1 className="mt-1 text-2xl font-bold">
                لوحة التحكم
              </h1>
            </div>

            <button
              onClick={handleLogout}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 lg:hidden"
            >
              خروج
            </button>
          </div>
        </header>

        <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
          <section className="rounded-3xl bg-slate-900 p-7 text-white shadow-sm">
            <div className="max-w-2xl">
              <p className="text-sm font-medium text-blue-400">
                BookingOS
              </p>

              <h2 className="mt-2 text-3xl font-bold">
                {businessName
                  ? `أهلًا بك في ${businessName} 👋`
                  : "خلّي إدارة نشاطك أسهل."}
              </h2>

              <p className="mt-3 leading-7 text-slate-400">
                من هنا هتقدر تدير الحجوزات والعملاء والخدمات
                ومواعيد العمل من مكان واحد.
              </p>
            </div>
          </section>

          {error && (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* =========================
              Public Booking Link
          ========================= */}

          {businessId && (
            <section className="mt-8 overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-sm">
              <div className="bg-blue-600 px-6 py-6 text-white sm:px-8">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">🔗</span>

                      <div>
                        <h2 className="text-xl font-bold">
                          رابط الحجز الخاص بك
                        </h2>

                        <p className="mt-1 text-sm text-blue-100">
                          شارك الرابط مع عملائك ليحجزوا أونلاين.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-white/10 px-4 py-3 text-center backdrop-blur-sm">
                    <p className="text-xs text-blue-100">
                      نشاطك
                    </p>

                    <p className="mt-1 font-bold">
                      {businessName || "نشاطك التجاري"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 sm:p-8">
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  رابط صفحة الحجز العامة
                </label>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <input
                    type="text"
                    readOnly
                    value={getBookingUrl()}
                    className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 outline-none"
                  />

                  <button
                    type="button"
                    onClick={copyBookingLink}
                    className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
                  >
                    {copied ? "✓ تم النسخ" : "📋 نسخ الرابط"}
                  </button>
                </div>

                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={openBookingPage}
                    className="flex-1 rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                  >
                    🌐 فتح صفحة الحجز
                  </button>

                  <button
                    type="button"
                    onClick={shareBookingLink}
                    className="flex-1 rounded-xl border border-blue-200 bg-blue-50 px-5 py-3 text-sm font-bold text-blue-600 transition hover:bg-blue-100"
                  >
                    📤 مشاركة الرابط
                  </button>
                </div>

                <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-700">
                    💡 شارك الرابط مع عملائك
                  </p>

                  <p className="mt-1 text-xs leading-6 text-slate-500">
                    يمكنك إرساله على WhatsApp أو Facebook أو Instagram
                    أو وضعه في البايو الخاص بنشاطك.
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* Stats */}

          <section className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-500">
                  إجمالي الحجوزات
                </span>

                <span className="text-2xl">📋</span>
              </div>

              <p className="mt-4 text-3xl font-bold">
                {totalBookingsCount}
              </p>

              <p className="mt-2 text-xs text-slate-400">
                جميع الحجوزات الخاصة بنشاطك
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-500">
                  حجوزات اليوم
                </span>

                <span className="text-2xl">📅</span>
              </div>

              <p className="mt-4 text-3xl font-bold">
                {todayBookingsCount}
              </p>

              <p className="mt-2 text-xs text-slate-400">
                الحجوزات المقررة اليوم
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-500">
                  إجمالي العملاء
                </span>

                <span className="text-2xl">👥</span>
              </div>

              <p className="mt-4 text-3xl font-bold">
                {customersCount}
              </p>

              <p className="mt-2 text-xs text-slate-400">
                عملاء قاموا بالحجز
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-500">
                  الخدمات
                </span>

                <span className="text-2xl">🛎️</span>
              </div>

              <p className="mt-4 text-3xl font-bold">
                {servicesCount}
              </p>

              <p className="mt-2 text-xs text-slate-400">
                خدمات مضافة لنشاطك
              </p>
            </div>
          </section>

          <section className="mt-8">
            <div className="mb-5">
              <h2 className="text-xl font-bold">
                ابدأ من هنا
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                إدارة نشاطك من مكان واحد.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              <button
                onClick={() => router.push("/business")}
                className="rounded-2xl border border-slate-200 bg-white p-6 text-right shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
              >
                <div className="text-3xl">🏪</div>

                <h3 className="mt-4 font-bold">
                  إعداد النشاط
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  تعديل بيانات نشاطك التجاري.
                </p>
              </button>

              <button
                onClick={() => router.push("/services")}
                className="rounded-2xl border border-slate-200 bg-white p-6 text-right shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
              >
                <div className="text-3xl">🛎️</div>

                <h3 className="mt-4 font-bold">
                  إدارة الخدمات
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  أضف وعدّل الخدمات والأسعار والمدة.
                </p>
              </button>

              <button
                onClick={() => router.push("#bookings")}
                className="rounded-2xl border border-slate-200 bg-white p-6 text-right shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
              >
                <div className="text-3xl">📅</div>

                <h3 className="mt-4 font-bold">
                  إدارة الحجوزات
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  راجع الحجوزات وقم بتأكيدها أو إلغائها.
                </p>
              </button>
            </div>
          </section>

          <section
            id="bookings"
            className="mt-8 rounded-2xl border border-slate-200 bg-white shadow-sm"
          >
            <div className="border-b border-slate-100 px-6 py-5">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                  <h2 className="text-xl font-bold">
                    الحجوزات
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    جميع الحجوزات الخاصة بنشاطك.
                  </p>
                </div>

                <span className="w-fit rounded-full bg-blue-50 px-4 py-2 text-xs font-semibold text-blue-600">
                  {bookings.length} حجز
                </span>
              </div>
            </div>

            {bookings.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                <div className="text-5xl">📅</div>

                <h3 className="mt-5 text-xl font-bold">
                  لا توجد حجوزات حتى الآن
                </h3>

                <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                  عندما يقوم أحد العملاء بالحجز من صفحة نشاطك،
                  سيظهر الحجز هنا.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {bookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="p-6 transition hover:bg-slate-50"
                  >
                    <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="text-lg font-bold">
                            {booking.customer_name}
                          </h3>

                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-semibold ${getStatusClass(
                              booking.status
                            )}`}
                          >
                            {getStatusLabel(booking.status)}
                          </span>
                        </div>

                        <div className="mt-3 space-y-1 text-sm text-slate-500">
                          <p>
                            📞 {booking.customer_phone}
                          </p>

                          {booking.customer_email && (
                            <p>
                              ✉️ {booking.customer_email}
                            </p>
                          )}

                          <p>
                            🛎️{" "}
                            {getServiceName(
                              booking.service_id
                            )}
                          </p>
                        </div>

                        {booking.notes && (
                          <div className="mt-4 rounded-xl bg-slate-100 px-4 py-3 text-sm text-slate-600">
                            <span className="font-semibold">
                              ملاحظات:
                            </span>{" "}
                            {booking.notes}
                          </div>
                        )}
                      </div>

                      <div className="rounded-2xl bg-slate-50 px-5 py-4 text-center xl:min-w-44">
                        <p className="text-xs font-medium text-slate-400">
                          موعد الحجز
                        </p>

                        <p className="mt-2 font-bold">
                          {booking.booking_date}
                        </p>

                        <p className="mt-1 text-sm text-blue-600">
                          🕐 {booking.booking_time}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {booking.status === "pending" && (
                          <>
                            <button
                              disabled={
                                bookingActionId === booking.id
                              }
                              onClick={() =>
                                updateBookingStatus(
                                  booking.id,
                                  "confirmed"
                                )
                              }
                              className="rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {bookingActionId === booking.id
                                ? "..."
                                : "تأكيد"}
                            </button>

                            <button
                              disabled={
                                bookingActionId === booking.id
                              }
                              onClick={() =>
                                updateBookingStatus(
                                  booking.id,
                                  "cancelled"
                                )
                              }
                              className="rounded-xl bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              إلغاء
                            </button>
                          </>
                        )}

                        <button
                          disabled={
                            bookingActionId === booking.id
                          }
                          onClick={() =>
                            deleteBooking(booking.id)
                          }
                          className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          حذف
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}