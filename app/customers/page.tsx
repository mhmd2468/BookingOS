"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Booking = {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  booking_date: string;
  booking_time: string;
  status: string;
  service_id: string;
};

type Service = {
  id: string;
  name: string;
  price: number | null;
  duration: number | null;
};

type CustomerBooking = {
  id: string;
  serviceName: string;
  price: number;
  date: string;
  time: string;
  status: string;
};

type Customer = {
  name: string;
  phone: string;
  email: string | null;
  bookingsCount: number;
  totalSpent: number;
  lastBookingDate: string;
  lastBookingTime: string;
  services: string[];
  bookings: CustomerBooking[];
};

export default function CustomersPage() {
  const router = useRouter();

  const [businessName, setBusinessName] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] =
    useState<Customer | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadCustomers();
  }, []);

  async function loadCustomers() {
    try {
      setLoading(true);
      setError("");

      // =========================
      // 1. التأكد من تسجيل الدخول
      // =========================

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.error(userError);
        setError("حدث خطأ أثناء التحقق من الحساب.");
        setLoading(false);
        return;
      }

      if (!user) {
        router.replace("/login");
        return;
      }

      // =========================
      // 2. جلب النشاط
      // =========================

      const { data: business, error: businessError } =
        await supabase
          .from("businesses")
          .select("id, name")
          .eq("owner_id", user.id)
          .maybeSingle();

      if (businessError) {
        console.error("Business error:", businessError);
        setError("حدث خطأ أثناء تحميل بيانات النشاط.");
        setLoading(false);
        return;
      }

      if (!business) {
        setError("لم يتم العثور على النشاط الخاص بك.");
        setLoading(false);
        return;
      }

      setBusinessName(business.name ?? "");

      // =========================
      // 3. جلب الخدمات
      // =========================

      const { data: servicesData, error: servicesError } =
        await supabase
          .from("services")
          .select("id, name, price, duration")
          .eq("business_id", business.id);

      if (servicesError) {
        console.error("Services error:", servicesError);
      }

      const services: Service[] = servicesData ?? [];

      // =========================
      // 4. جلب الحجوزات
      // =========================

      const { data: bookingsData, error: bookingsError } =
        await supabase
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
            service_id
            `
          )
          .eq("business_id", business.id)
          .order("booking_date", {
            ascending: false,
          })
          .order("booking_time", {
            ascending: false,
          });

      if (bookingsError) {
        console.error("Bookings error:", bookingsError);

        setError(
          "حدث خطأ أثناء تحميل العملاء. تأكد من صلاحيات جدول الحجوزات."
        );

        setLoading(false);
        return;
      }

      const bookings: Booking[] = bookingsData ?? [];

      // =========================
      // 5. تحويل الحجوزات إلى عملاء
      // =========================

      const customerMap = new Map<string, Customer>();

      for (const booking of bookings) {
        const phone = booking.customer_phone?.trim();

        if (!phone) continue;

        const service = services.find(
          (item) => item.id === booking.service_id
        );

        const serviceName = service?.name ?? "خدمة";

        const servicePrice =
          typeof service?.price === "number"
            ? service.price
            : 0;

        const existingCustomer = customerMap.get(phone);

        const bookingInfo: CustomerBooking = {
          id: booking.id,
          serviceName,
          price: servicePrice,
          date: booking.booking_date,
          time: booking.booking_time,
          status: booking.status,
        };

        // =========================
        // عميل جديد
        // =========================

        if (!existingCustomer) {
          customerMap.set(phone, {
            name: booking.customer_name || "عميل",
            phone,
            email: booking.customer_email,
            bookingsCount: 1,
            totalSpent: servicePrice,
            lastBookingDate: booking.booking_date,
            lastBookingTime: booking.booking_time,
            services: [serviceName],
            bookings: [bookingInfo],
          });

          continue;
        }

        // =========================
        // عميل موجود
        // =========================

        existingCustomer.bookingsCount += 1;
        existingCustomer.totalSpent += servicePrice;

        if (
          booking.customer_email &&
          !existingCustomer.email
        ) {
          existingCustomer.email = booking.customer_email;
        }

        if (
          serviceName &&
          !existingCustomer.services.includes(serviceName)
        ) {
          existingCustomer.services.push(serviceName);
        }

        existingCustomer.bookings.push(bookingInfo);
      }

      setCustomers(Array.from(customerMap.values()));
    } catch (err) {
      console.error("Customers page error:", err);

      setError(
        "حدث خطأ غير متوقع أثناء تحميل صفحة العملاء."
      );
    } finally {
      setLoading(false);
    }
  }

  // =========================
  // البحث
  // =========================

  const filteredCustomers = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) {
      return customers;
    }

    return customers.filter((customer) => {
      const name = customer.name?.toLowerCase() ?? "";
      const phone = customer.phone?.toLowerCase() ?? "";
      const email = customer.email?.toLowerCase() ?? "";

      return (
        name.includes(value) ||
        phone.includes(value) ||
        email.includes(value)
      );
    });
  }, [customers, search]);

  // =========================
  // إجمالي الحجوزات
  // =========================

  const totalBookings = customers.reduce(
    (total, customer) =>
      total + customer.bookingsCount,
    0
  );

  // =========================
  // إجمالي الإيرادات
  // =========================

  const totalRevenue = customers.reduce(
    (total, customer) =>
      total + customer.totalSpent,
    0
  );

  // =========================
  // تسجيل الخروج
  // =========================

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  // =========================
  // فتح WhatsApp
  // =========================

  function openWhatsApp(phone: string) {
    let cleanPhone = phone.replace(/\D/g, "");

    if (cleanPhone.startsWith("01")) {
      cleanPhone = "20" + cleanPhone.substring(1);
    }

    window.open(
      `https://wa.me/${cleanPhone}`,
      "_blank"
    );
  }

  // =========================
  // حالة الحجز
  // =========================

  function getStatusLabel(status: string) {
    switch (status) {
      case "confirmed":
        return "مؤكد";

      case "completed":
        return "مكتمل";

      case "cancelled":
        return "ملغي";

      case "pending":
        return "قيد الانتظار";

      default:
        return status;
    }
  }

  function getStatusClass(status: string) {
    switch (status) {
      case "confirmed":
        return "bg-blue-50 text-blue-600";

      case "completed":
        return "bg-green-50 text-green-600";

      case "cancelled":
        return "bg-red-50 text-red-600";

      case "pending":
        return "bg-amber-50 text-amber-600";

      default:
        return "bg-slate-100 text-slate-600";
    }
  }

  // =========================
  // Loading
  // =========================

  if (loading) {
    return (
      <main
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-slate-950"
      >
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-blue-500" />

          <p className="mt-4 text-sm text-slate-400">
            جاري تحميل العملاء...
          </p>
        </div>
      </main>
    );
  }

  // =========================
  // الصفحة
  // =========================

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-slate-100 text-slate-900"
    >
      {/* =========================
          Sidebar
      ========================= */}

      <aside className="fixed right-0 top-0 hidden h-screen w-64 border-l border-slate-200 bg-white lg:block">
        <div className="flex h-full flex-col">

          {/* Logo */}

          <div className="border-b border-slate-100 px-6 py-6">
            <div className="text-2xl font-bold tracking-tight">
              Booking
              <span className="text-blue-600">OS</span>
            </div>

            <p className="mt-1 text-xs text-slate-400">
              لوحة إدارة نشاطك
            </p>
          </div>

          {/* Navigation */}

          <nav className="flex-1 space-y-2 px-4 py-6">

            <a
              href="/dashboard"
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-slate-600 transition hover:bg-slate-50"
            >
              <span>📊</span>
              <span>نظرة عامة</span>
            </a>

            <a
              href="/dashboard#bookings"
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-slate-600 transition hover:bg-slate-50"
            >
              <span>📅</span>
              <span>الحجوزات</span>
            </a>

            <a
              href="/customers"
              className="flex items-center gap-3 rounded-xl bg-blue-50 px-4 py-3 font-semibold text-blue-600"
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

          {/* Account */}

          <div className="border-t border-slate-100 p-4">

            <div className="mb-3 rounded-xl bg-slate-50 px-4 py-3">
              <p className="truncate text-sm font-medium text-slate-900">
                {businessName || "صاحب النشاط"}
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

      {/* =========================
          Main
      ========================= */}

      <div className="lg:mr-64">

        {/* Header */}

        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-8">

            <div>
              <p className="text-sm text-slate-400">
                {businessName || "نشاطك"}
              </p>

              <h1 className="mt-1 text-2xl font-bold">
                العملاء
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

        {/* Content */}

        <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">

          {/* Intro */}

          <section className="rounded-3xl bg-slate-900 p-7 text-white shadow-sm">

            <p className="text-sm font-medium text-blue-400">
              BookingOS CRM
            </p>

            <h2 className="mt-2 text-3xl font-bold">
              عملاء نشاطك 👥
            </h2>

            <p className="mt-3 max-w-2xl leading-7 text-slate-400">
              اعرف عملاءك، حجوزاتهم، الخدمات التي استخدموها
              وإجمالي قيمة تعاملاتهم مع نشاطك.
            </p>

          </section>

          {/* Error */}

          {error && (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Stats */}

          <section className="mt-8 grid gap-5 sm:grid-cols-3">

            {/* Customers */}

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-500">
                  إجمالي العملاء
                </span>

                <span className="text-2xl">
                  👥
                </span>
              </div>

              <p className="mt-4 text-3xl font-bold">
                {customers.length}
              </p>

              <p className="mt-2 text-xs text-slate-400">
                عملاء قاموا بالحجز
              </p>

            </div>

            {/* Bookings */}

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-500">
                  إجمالي الحجوزات
                </span>

                <span className="text-2xl">
                  📅
                </span>
              </div>

              <p className="mt-4 text-3xl font-bold">
                {totalBookings}
              </p>

              <p className="mt-2 text-xs text-slate-400">
                جميع الحجوزات
              </p>

            </div>

            {/* Revenue */}

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-500">
                  إجمالي القيمة
                </span>

                <span className="text-2xl">
                  💰
                </span>
              </div>

              <p className="mt-4 text-3xl font-bold">
                {totalRevenue.toLocaleString("ar-EG")}
              </p>

              <p className="mt-2 text-xs text-slate-400">
                ج.م
              </p>

            </div>

          </section>

          {/* Search */}

          <section className="mt-8">

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

              <label
                htmlFor="customerSearch"
                className="mb-2 block text-sm font-semibold"
              >
                البحث عن عميل
              </label>

              <input
                id="customerSearch"
                type="search"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="ابحث بالاسم أو رقم الهاتف أو البريد الإلكتروني..."
                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              />

            </div>

          </section>

          {/* Customers */}

          <section className="mt-8 rounded-2xl border border-slate-200 bg-white shadow-sm">

            <div className="border-b border-slate-100 px-6 py-5">

              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">

                <div>
                  <h2 className="text-xl font-bold">
                    قائمة العملاء
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    {search
                      ? `نتائج البحث عن "${search}"`
                      : "اضغط على أي عميل لعرض ملفه الكامل."}
                  </p>
                </div>

                <span className="w-fit rounded-full bg-blue-50 px-4 py-2 text-xs font-semibold text-blue-600">
                  {filteredCustomers.length} عميل
                </span>

              </div>

            </div>

            {/* No customers */}

            {filteredCustomers.length === 0 ? (

              <div className="flex flex-col items-center justify-center px-6 py-16 text-center">

                <div className="text-5xl">
                  {search ? "🔎" : "👥"}
                </div>

                <h3 className="mt-5 text-xl font-bold">
                  {search
                    ? "لم نجد هذا العميل"
                    : "لا يوجد عملاء حتى الآن"}
                </h3>

                <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                  {search
                    ? "جرب البحث باسم مختلف أو رقم هاتف آخر."
                    : "عندما يقوم العملاء بالحجز سيظهرون هنا تلقائيًا."}
                </p>

              </div>

            ) : (

              <div className="divide-y divide-slate-100">

                {filteredCustomers.map((customer) => (

                  <button
                    key={customer.phone}
                    type="button"
                    onClick={() =>
                      setSelectedCustomer(customer)
                    }
                    className="block w-full p-6 text-right transition hover:bg-slate-50"
                  >

                    <div className="flex flex-col gap-6 xl:flex-row xl:items-center">

                      {/* Customer */}

                      <div className="min-w-0 flex-1">

                        <div className="flex flex-wrap items-center gap-3">

                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xl">
                            👤
                          </div>

                          <div>

                            <h3 className="text-lg font-bold">
                              {customer.name}
                            </h3>

                            <p className="mt-1 text-sm text-slate-500">
                              📞 {customer.phone}
                            </p>

                          </div>

                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">

                          {customer.email && (
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-500">
                              ✉️ {customer.email}
                            </span>
                          )}

                          {customer.services.map(
                            (service) => (
                              <span
                                key={service}
                                className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600"
                              >
                                🛎️ {service}
                              </span>
                            )
                          )}

                        </div>

                      </div>

                      {/* Booking Count */}

                      <div className="rounded-2xl bg-slate-50 px-6 py-4 text-center">

                        <p className="text-xs font-medium text-slate-400">
                          عدد الحجوزات
                        </p>

                        <p className="mt-2 text-2xl font-bold">
                          {customer.bookingsCount}
                        </p>

                      </div>

                      {/* Total */}

                      <div className="rounded-2xl bg-green-50 px-6 py-4 text-center">

                        <p className="text-xs font-medium text-green-600">
                          إجمالي القيمة
                        </p>

                        <p className="mt-2 text-xl font-bold text-green-700">
                          {customer.totalSpent.toLocaleString(
                            "ar-EG"
                          )}{" "}
                          ج.م
                        </p>

                      </div>

                      {/* Last Booking */}

                      <div className="rounded-2xl bg-slate-50 px-6 py-4 text-center">

                        <p className="text-xs font-medium text-slate-400">
                          آخر حجز
                        </p>

                        <p className="mt-2 font-bold">
                          {customer.lastBookingDate}
                        </p>

                        <p className="mt-1 text-sm text-blue-600">
                          🕐 {customer.lastBookingTime}
                        </p>

                      </div>

                      <div className="text-2xl text-slate-300">
                        ←
                      </div>

                    </div>

                  </button>

                ))}

              </div>

            )}

          </section>

        </div>

      </div>

      {/* =========================
          Customer Profile Modal
      ========================= */}

      {selectedCustomer && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
          onClick={() =>
            setSelectedCustomer(null)
          }
        >

          <div
            className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white shadow-2xl"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            {/* Profile Header */}

            <div className="bg-slate-900 p-7 text-white">

              <div className="flex items-start justify-between gap-4">

                <div className="flex items-center gap-4">

                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 text-3xl">
                    👤
                  </div>

                  <div>

                    <h2 className="text-2xl font-bold">
                      {selectedCustomer.name}
                    </h2>

                    <p className="mt-1 text-sm text-slate-400">
                      📞 {selectedCustomer.phone}
                    </p>

                    {selectedCustomer.email && (
                      <p className="mt-1 text-sm text-slate-400">
                        ✉️ {selectedCustomer.email}
                      </p>
                    )}

                  </div>

                </div>

                <button
                  type="button"
                  onClick={() =>
                    setSelectedCustomer(null)
                  }
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-xl text-white transition hover:bg-white/20"
                >
                  ×
                </button>

              </div>

              {/* Contact Buttons */}

              <div className="mt-6 flex flex-wrap gap-3">

                <a
                  href={`tel:${selectedCustomer.phone}`}
                  className="rounded-xl bg-white px-5 py-3 text-sm font-bold text-slate-900 transition hover:bg-slate-100"
                >
                  📞 اتصال
                </a>

                <button
                  type="button"
                  onClick={() =>
                    openWhatsApp(
                      selectedCustomer.phone
                    )
                  }
                  className="rounded-xl bg-green-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-green-600"
                >
                  💬 WhatsApp
                </button>

              </div>

            </div>

            {/* Profile Content */}

            <div className="p-6 sm:p-8">

              {/* Stats */}

              <div className="grid gap-4 sm:grid-cols-3">

                <div className="rounded-2xl bg-blue-50 p-5 text-center">

                  <p className="text-xs font-medium text-blue-500">
                    الحجوزات
                  </p>

                  <p className="mt-2 text-3xl font-bold text-blue-700">
                    {selectedCustomer.bookingsCount}
                  </p>

                </div>

                <div className="rounded-2xl bg-green-50 p-5 text-center">

                  <p className="text-xs font-medium text-green-600">
                    إجمالي القيمة
                  </p>

                  <p className="mt-2 text-2xl font-bold text-green-700">
                    {selectedCustomer.totalSpent.toLocaleString(
                      "ar-EG"
                    )}{" "}
                    ج.م
                  </p>

                </div>

                <div className="rounded-2xl bg-slate-100 p-5 text-center">

                  <p className="text-xs font-medium text-slate-500">
                    آخر حجز
                  </p>

                  <p className="mt-2 font-bold">
                    {selectedCustomer.lastBookingDate}
                  </p>

                  <p className="mt-1 text-sm text-blue-600">
                    {selectedCustomer.lastBookingTime}
                  </p>

                </div>

              </div>

              {/* Services */}

              <div className="mt-8">

                <h3 className="text-lg font-bold">
                  الخدمات التي استخدمها
                </h3>

                <div className="mt-4 flex flex-wrap gap-2">

                  {selectedCustomer.services.map(
                    (service) => (
                      <span
                        key={service}
                        className="rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-600"
                      >
                        🛎️ {service}
                      </span>
                    )
                  )}

                </div>

              </div>

              {/* Booking History */}

              <div className="mt-8">

                <div className="flex items-center justify-between">

                  <div>
                    <h3 className="text-lg font-bold">
                      سجل الحجوزات
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      جميع الحجوزات الخاصة بهذا العميل
                    </p>
                  </div>

                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                    {selectedCustomer.bookings.length}
                  </span>

                </div>

                <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">

                  {selectedCustomer.bookings.map(
                    (booking, index) => (

                      <div
                        key={booking.id}
                        className={`p-5 ${
                          index !==
                          selectedCustomer.bookings.length -
                            1
                            ? "border-b border-slate-100"
                            : ""
                        }`}
                      >

                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                          <div>

                            <h4 className="font-bold">
                              {booking.serviceName}
                            </h4>

                            <div className="mt-2 flex flex-wrap gap-2">

                              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                                📅 {booking.date}
                              </span>

                              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                                🕐 {booking.time}
                              </span>

                            </div>

                          </div>

                          <div className="text-right">

                            <p className="font-bold">
                              {booking.price.toLocaleString(
                                "ar-EG"
                              )}{" "}
                              ج.م
                            </p>

                            <span
                              className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                                booking.status
                              )}`}
                            >
                              {getStatusLabel(
                                booking.status
                              )}
                            </span>

                          </div>

                        </div>

                      </div>

                    )
                  )}

                </div>

              </div>

            </div>

          </div>

        </div>
      )}

    </main>
  );
}