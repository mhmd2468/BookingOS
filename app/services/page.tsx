"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Service = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration: number;
  created_at: string;
};

export default function ServicesPage() {
  const router = useRouter();

  const [services, setServices] = useState<Service[]>([]);
  const [businessId, setBusinessId] = useState("");
  const [businessName, setBusinessName] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadServices();
  }, []);

  async function loadServices() {
    setLoading(true);
    setError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.replace("/login");
      return;
    }

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
      setError("لم يتم العثور على نشاط مرتبط بحسابك.");
      setLoading(false);
      return;
    }

    setBusinessId(business.id);
    setBusinessName(business.name ?? "");

    const { data: servicesData, error: servicesError } = await supabase
      .from("services")
      .select("id, name, description, price, duration, created_at")
      .eq("business_id", business.id)
      .order("created_at", {
        ascending: true,
      });

    if (servicesError) {
      console.error(servicesError);
      setError("حدث خطأ أثناء تحميل الخدمات.");
      setLoading(false);
      return;
    }

    setServices(servicesData ?? []);
    setLoading(false);
  }

  function resetForm() {
    setName("");
    setDescription("");
    setPrice("");
    setDuration("");
    setEditingId(null);
    setShowForm(false);
  }

  function startAddService() {
    setSuccess("");
    setError("");
    setEditingId(null);

    setName("");
    setDescription("");
    setPrice("");
    setDuration("");

    setShowForm(true);
  }

  function startEditService(service: Service) {
    setSuccess("");
    setError("");

    setEditingId(service.id);
    setName(service.name);
    setDescription(service.description ?? "");
    setPrice(String(service.price));
    setDuration(String(service.duration));

    setShowForm(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function saveService() {
    setError("");
    setSuccess("");

    if (!name.trim()) {
      setError("اكتب اسم الخدمة.");
      return;
    }

    if (!price.trim()) {
      setError("اكتب سعر الخدمة.");
      return;
    }

    if (!duration.trim()) {
      setError("اكتب مدة الخدمة.");
      return;
    }

    const priceNumber = Number(price);
    const durationNumber = Number(duration);

    if (Number.isNaN(priceNumber) || priceNumber < 0) {
      setError("السعر غير صحيح.");
      return;
    }

    if (
      Number.isNaN(durationNumber) ||
      durationNumber <= 0
    ) {
      setError("مدة الخدمة يجب أن تكون أكبر من صفر.");
      return;
    }

    if (!businessId) {
      setError("لم يتم العثور على النشاط.");
      return;
    }

    setSaving(true);

    if (editingId) {
      const { data, error: updateError } = await supabase
        .from("services")
        .update({
          name: name.trim(),
          description: description.trim() || null,
          price: priceNumber,
          duration: durationNumber,
        })
        .eq("id", editingId)
        .eq("business_id", businessId)
        .select("id, name, description, price, duration, created_at")
        .single();

      if (updateError) {
        console.error(updateError);
        setError("حدث خطأ أثناء تعديل الخدمة.");
        setSaving(false);
        return;
      }

      setServices((currentServices) =>
        currentServices.map((service) =>
          service.id === editingId ? data : service
        )
      );

      setSuccess("تم تعديل الخدمة بنجاح.");
    } else {
      const { data, error: insertError } = await supabase
        .from("services")
        .insert({
          business_id: businessId,
          name: name.trim(),
          description: description.trim() || null,
          price: priceNumber,
          duration: durationNumber,
        })
        .select("id, name, description, price, duration, created_at")
        .single();

      if (insertError) {
        console.error(insertError);
        setError("حدث خطأ أثناء إضافة الخدمة.");
        setSaving(false);
        return;
      }

      setServices((currentServices) => [
        ...currentServices,
        data,
      ]);

      setSuccess("تمت إضافة الخدمة بنجاح.");
    }

    setSaving(false);

    setName("");
    setDescription("");
    setPrice("");
    setDuration("");
    setEditingId(null);
    setShowForm(false);
  }

  async function deleteService(serviceId: string) {
    const service = services.find(
      (item) => item.id === serviceId
    );

    if (!service) return;

    const confirmed = window.confirm(
      `هل أنت متأكد أنك تريد حذف خدمة "${service.name}"؟`
    );

    if (!confirmed) return;

    setDeletingId(serviceId);
    setError("");
    setSuccess("");

    const { error: deleteError } = await supabase
      .from("services")
      .delete()
      .eq("id", serviceId)
      .eq("business_id", businessId);

    if (deleteError) {
      console.error(deleteError);
      setError(
        "لم نتمكن من حذف الخدمة. قد تكون مرتبطة بحجوزات موجودة."
      );
      setDeletingId(null);
      return;
    }

    setServices((currentServices) =>
      currentServices.filter(
        (item) => item.id !== serviceId
      )
    );

    setDeletingId(null);
    setSuccess("تم حذف الخدمة بنجاح.");
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  if (loading) {
    return (
      <main
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-slate-100"
      >
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

          <p className="mt-4 text-sm text-slate-500">
            جاري تحميل الخدمات...
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
            <button
              onClick={() => router.push("/dashboard")}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-right text-slate-600 transition hover:bg-slate-50"
            >
              <span>📊</span>
              <span>نظرة عامة</span>
            </button>

            <button
              onClick={() => router.push("/dashboard#bookings")}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-right text-slate-600 transition hover:bg-slate-50"
            >
              <span>📅</span>
              <span>الحجوزات</span>
            </button>

            <button
              onClick={() => router.push("/dashboard#customers")}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-right text-slate-600 transition hover:bg-slate-50"
            >
              <span>👥</span>
              <span>العملاء</span>
            </button>

            <button
              onClick={() => router.push("/services")}
              className="flex w-full items-center gap-3 rounded-xl bg-blue-50 px-4 py-3 text-right font-semibold text-blue-600"
            >
              <span>🛎️</span>
              <span>الخدمات</span>
            </button>

            <button
              onClick={() => router.push("/business")}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-right text-slate-600 transition hover:bg-slate-50"
            >
              <span>⚙️</span>
              <span>إعداد النشاط</span>
            </button>
          </nav>

          <div className="border-t border-slate-100 p-4">
            <div className="mb-3 rounded-xl bg-slate-50 px-4 py-3">
              <p className="truncate text-sm font-medium text-slate-900">
                {businessName || "نشاطك"}
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

      {/* Main */}

      <div className="lg:mr-64">
        {/* Header */}

        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-8">
            <div>
              <p className="text-sm text-slate-400">
                BookingOS
              </p>

              <h1 className="mt-1 text-2xl font-bold">
                إدارة الخدمات
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push("/dashboard")}
                className="hidden rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 sm:block"
              >
                لوحة التحكم
              </button>

              <button
                onClick={handleLogout}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                خروج
              </button>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
          {/* Page Intro */}

          <section className="rounded-3xl bg-slate-900 p-7 text-white shadow-sm">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-medium text-blue-400">
                  {businessName || "BookingOS"}
                </p>

                <h2 className="mt-2 text-3xl font-bold">
                  خدمات نشاطك 🛎️
                </h2>

                <p className="mt-3 max-w-2xl leading-7 text-slate-400">
                  أضف الخدمات التي يقدمها نشاطك وحدد السعر
                  ومدة كل خدمة حتى يستطيع العملاء اختيارها
                  أثناء الحجز.
                </p>
              </div>

              <button
                onClick={startAddService}
                className="rounded-2xl bg-blue-600 px-6 py-3.5 font-semibold text-white transition hover:bg-blue-700"
              >
                + إضافة خدمة
              </button>
            </div>
          </section>

          {/* Messages */}

          {error && (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="mt-6 rounded-2xl border border-green-200 bg-green-50 px-5 py-4 text-sm text-green-700">
              {success}
            </div>
          )}

          {/* Add/Edit Form */}

          {showForm && (
            <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">
                    {editingId
                      ? "تعديل الخدمة"
                      : "إضافة خدمة جديدة"}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    أدخل بيانات الخدمة ثم احفظها.
                  </p>
                </div>

                <button
                  onClick={resetForm}
                  className="rounded-xl px-3 py-2 text-slate-500 transition hover:bg-slate-100"
                >
                  ✕
                </button>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                {/* Name */}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    اسم الخدمة
                  </label>

                  <input
                    type="text"
                    value={name}
                    onChange={(event) =>
                      setName(event.target.value)
                    }
                    placeholder="مثال: قص شعر"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                  />
                </div>

                {/* Price */}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    السعر
                  </label>

                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      value={price}
                      onChange={(event) =>
                        setPrice(event.target.value)
                      }
                      placeholder="مثال: 150"
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pl-14 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                    />

                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                      جنيه
                    </span>
                  </div>
                </div>

                {/* Duration */}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    مدة الخدمة
                  </label>

                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      value={duration}
                      onChange={(event) =>
                        setDuration(event.target.value)
                      }
                      placeholder="مثال: 30"
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pl-16 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                    />

                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                      دقيقة
                    </span>
                  </div>
                </div>

                {/* Description */}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    وصف الخدمة
                  </label>

                  <input
                    type="text"
                    value={description}
                    onChange={(event) =>
                      setDescription(event.target.value)
                    }
                    placeholder="وصف مختصر للخدمة"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                  />
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={saveService}
                  disabled={saving}
                  className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? "جاري الحفظ..."
                    : editingId
                    ? "حفظ التعديلات"
                    : "إضافة الخدمة"}
                </button>

                <button
                  onClick={resetForm}
                  disabled={saving}
                  className="rounded-xl border border-slate-200 px-6 py-3 font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  إلغاء
                </button>
              </div>
            </section>
          )}

          {/* Stats */}

          <section className="mt-8 grid gap-5 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-medium text-slate-500">
                إجمالي الخدمات
              </p>

              <p className="mt-3 text-3xl font-bold">
                {services.length}
              </p>

              <p className="mt-2 text-xs text-slate-400">
                خدمات متاحة لنشاطك
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-medium text-slate-500">
                أقل سعر
              </p>

              <p className="mt-3 text-3xl font-bold">
                {services.length > 0
                  ? `${Math.min(
                      ...services.map((service) =>
                        Number(service.price)
                      )
                    )} جنيه`
                  : "—"}
              </p>

              <p className="mt-2 text-xs text-slate-400">
                أقل سعر بين الخدمات
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-medium text-slate-500">
                متوسط المدة
              </p>

              <p className="mt-3 text-3xl font-bold">
                {services.length > 0
                  ? `${Math.round(
                      services.reduce(
                        (total, service) =>
                          total + Number(service.duration),
                        0
                      ) / services.length
                    )} دقيقة`
                  : "—"}
              </p>

              <p className="mt-2 text-xs text-slate-400">
                متوسط مدة الخدمات
              </p>
            </div>
          </section>

          {/* Services */}

          <section className="mt-8">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-bold">
                  خدماتك
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  الخدمات التي يمكن للعملاء اختيارها عند الحجز.
                </p>
              </div>

              <span className="w-fit rounded-full bg-blue-50 px-4 py-2 text-xs font-semibold text-blue-600">
                {services.length} خدمة
              </span>
            </div>

            {services.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-20 text-center">
                <div className="text-6xl">🛎️</div>

                <h3 className="mt-5 text-xl font-bold">
                  لا توجد خدمات حتى الآن
                </h3>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                  أضف أول خدمة لنشاطك حتى يستطيع العملاء
                  اختيارها أثناء إنشاء الحجز.
                </p>

                <button
                  onClick={startAddService}
                  className="mt-6 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
                >
                  + إضافة أول خدمة
                </button>
              </div>
            ) : (
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {services.map((service) => (
                  <div
                    key={service.id}
                    className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-2xl">
                        🛎️
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            startEditService(service)
                          }
                          className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                        >
                          تعديل
                        </button>

                        <button
                          onClick={() =>
                            deleteService(service.id)
                          }
                          disabled={
                            deletingId === service.id
                          }
                          className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {deletingId === service.id
                            ? "..."
                            : "حذف"}
                        </button>
                      </div>
                    </div>

                    <h3 className="mt-6 text-xl font-bold">
                      {service.name}
                    </h3>

                    {service.description && (
                      <p className="mt-2 min-h-12 text-sm leading-6 text-slate-500">
                        {service.description}
                      </p>
                    )}

                    {!service.description && (
                      <p className="mt-2 min-h-12 text-sm text-slate-400">
                        لا يوجد وصف للخدمة.
                      </p>
                    )}

                    <div className="mt-6 grid grid-cols-2 gap-3">
                      <div className="rounded-2xl bg-slate-50 p-4">
                        <p className="text-xs text-slate-400">
                          السعر
                        </p>

                        <p className="mt-1 font-bold text-slate-900">
                          {Number(service.price)} جنيه
                        </p>
                      </div>

                      <div className="rounded-2xl bg-slate-50 p-4">
                        <p className="text-xs text-slate-400">
                          المدة
                        </p>

                        <p className="mt-1 font-bold text-slate-900">
                          {Number(service.duration)} دقيقة
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