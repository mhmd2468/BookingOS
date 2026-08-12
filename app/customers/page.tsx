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
};

type Customer = {
  name: string;
  phone: string;
  email: string | null;
  bookingsCount: number;
  lastBookingDate: string;
  lastBookingTime: string;
  services: string[];
};

export default function CustomersPage() {
  const router = useRouter();

  const [businessId, setBusinessId] = useState("");
  const [businessName, setBusinessName] = useState("");

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadCustomers();
  }, []);

  async function loadCustomers() {
    setLoading(true);
    setError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.replace("/login");
      return;
    }

    const { data: business, error: businessError } =
      await supabase
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
      setError("لم يتم العثور على النشاط.");
      setLoading(false);
      return;
    }

    setBusinessId(business.id);
    setBusinessName(business.name ?? "");

    const { data: servicesData, error: servicesError } =
      await supabase
        .from("services")
        .select("id, name")
        .eq("business_id", business.id);

    if (servicesError) {
      console.error(servicesError);
      setError("حدث خطأ أثناء تحميل الخدمات.");
      setLoading(false);
      return;
    }

    const services = servicesData ?? [];

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
        .neq("status", "cancelled")
        .order("booking_date", {
          ascending: false,
        })
        .order("booking_time", {
          ascending: false,
        });

    if (bookingsError) {
      console.error(bookingsError);
      setError("حدث خطأ أثناء تحميل بيانات العملاء.");
      setLoading(false);
      return;
    }

    const bookings = bookingsData ?? [];

    const customerMap = new Map<string, Customer>();

    bookings.forEach((booking: Booking) => {
      const phone = booking.customer_phone?.trim();

      if (!phone) return;

      const serviceName =
        services.find(
          (service: Service) =>
            service.id === booking.service_id
        )?.name ?? "خدمة";

      const existing = customerMap.get(phone);

      if (!existing) {
        customerMap.set(phone, {
          name: booking.customer_name,
          phone,
          email: booking.customer_email,
          bookingsCount: 1,
          lastBookingDate: booking.booking_date,
          lastBookingTime: booking.booking_time,
          services: [serviceName],
        });

        return;
      }

      existing.bookingsCount += 1;

      if (
        booking.customer_email &&
        !existing.email
      ) {
        existing.email = booking.customer_email;
      }

      if (!existing.services.includes(serviceName)) {
        existing.services.push(serviceName);
      }
    });

    setCustomers(Array.from(customerMap.values()));

    setLoading(false);
  }

  const filteredCustomers = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) {
      return customers;
    }

    return customers.filter((customer) => {
      return (
        customer.name.toLowerCase().includes(value) ||
        customer.phone.toLowerCase().includes(value) ||
        customer.email?.toLowerCase().includes(value)
      );
    });
  }, [customers, search]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/login");
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
            جاري تحميل العملاء...
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
      {/* Sidebar */}

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

          <div className="border-t border-slate-100 p-4">
            <button
              onClick={handleLogout}
              className="w-full rounded-xl px-4 py-3 text-sm font-semibold text-red-500 transition hover:bg-red-50"
            >
              تسجيل الخروج
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}

      <div className="lg:mr-64">
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

        <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
          {/* Intro */}

          <section className="rounded-3xl bg-slate-900 p-7 text-white shadow-sm">
            <p className="text-sm font-medium text-blue-400">
              BookingOS
            </p>

            <h2 className="mt-2 text-3xl font-bold">
              عملاء نشاطك
            </h2>

            <p className="mt-3 max-w-2xl leading-7 text-slate-400">
              هنا هتلاقي كل العملاء اللي قاموا بالحجز
              من خلال نشاطك.
            </p>
          </section>

          {/* Error */}

          {error && (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Stats */}

          <section className="mt-8 grid gap-5 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-500">
                  إجمالي العملاء
                </span>

                <span className="text-2xl">👥</span>
              </div>

              <p className="mt-4 text-3xl font-bold">
                {customers.length}
              </p>

              <p className="mt-2 text-xs text-slate-400">
                عملاء قاموا بالحجز
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-500">
                  الحجوزات
                </span>

                <span className="text-2xl">📅</span>
              </div>

              <p className="mt-4 text-3xl font-bold">
                {customers.reduce(
                  (total, customer) =>
                    total + customer.bookingsCount,
                  0
                )}
              </p>

              <p className="mt-2 text-xs text-slate-400">
                إجمالي الحجوزات الحالية
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
                      : "جميع العملاء المسجلين من خلال الحجوزات."}
                  </p>
                </div>

                <span className="w-fit rounded-full bg-blue-50 px-4 py-2 text-xs font-semibold text-blue-600">
                  {filteredCustomers.length} عميل
                </span>
              </div>
            </div>

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
                  <div
                    key={customer.phone}
                    className="p-6 transition hover:bg-slate-50"
                  >
                    <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
                      {/* Customer */}

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-50 text-xl">
                            👤
                          </div>

                          <div>
                            <h3 className="text-lg font-bold">
                              {customer.name}
                            </h3>

                            <p className="mt-1 text-sm text-slate-500">
                              {customer.phone}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 space-y-2 text-sm text-slate-500">
                          {customer.email && (
                            <p>
                              ✉️ {customer.email}
                            </p>
                          )}

                          <p>
                            🛎️{" "}
                            {customer.services.join(
                              "، "
                            )}
                          </p>
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