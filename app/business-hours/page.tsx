"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Business = {
  id: string;
  name: string | null;
  type: string | null;
  phone: string | null;
  email: string | null;
  description: string | null;
};

type Service = {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  duration: number | null;
};

type BusinessHour = {
  day_of_week: number;
  is_open: boolean;
  open_time: string;
  close_time: string;
};

type Booking = {
  booking_time: string;
  status: string | null;
};

const days = [
  "الأحد",
  "الإثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
  "الجمعة",
  "السبت",
];

function timeToMinutes(time: string) {
  const [hours, minutes] = time.slice(0, 5).split(":").map(Number);

  return hours * 60 + minutes;
}

function minutesToTime(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(
    2,
    "0"
  )}`;
}

export default function BookingPage() {
  const params = useParams();

  const businessId = params.businessId as string;

  const [business, setBusiness] = useState<Business | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [businessHours, setBusinessHours] = useState<BusinessHour[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [booking, setBooking] = useState(false);

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("");
  const [notes, setNotes] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function loadBookingPage() {
      setLoading(true);
      setError("");

      const { data: businessData, error: businessError } =
        await supabase
          .from("businesses")
          .select(
            "id, name, type, phone, email, description"
          )
          .eq("id", businessId)
          .maybeSingle();

      if (businessError || !businessData) {
        setError("لم نتمكن من العثور على هذا النشاط.");
        setLoading(false);
        return;
      }

      setBusiness(businessData);

      const { data: servicesData, error: servicesError } =
        await supabase
          .from("services")
          .select(
            "id, name, description, price, duration"
          )
          .eq("business_id", businessId)
          .eq("is_active", true)
          .order("created_at", {
            ascending: true,
          });

      if (servicesError) {
        setError("حدث خطأ أثناء تحميل الخدمات.");
        setLoading(false);
        return;
      }

      setServices(servicesData ?? []);

      if (servicesData && servicesData.length > 0) {
        setServiceId(servicesData[0].id);
      }

      const { data: hoursData, error: hoursError } =
        await supabase
          .from("business_hours")
          .select(
            "day_of_week, is_open, open_time, close_time"
          )
          .eq("business_id", businessId)
          .order("day_of_week", {
            ascending: true,
          });

      if (hoursError) {
        setError("حدث خطأ أثناء تحميل مواعيد العمل.");
        setLoading(false);
        return;
      }

      setBusinessHours(hoursData ?? []);

      setLoading(false);
    }

    if (businessId) {
      loadBookingPage();
    }
  }, [businessId]);

  const selectedService = useMemo(() => {
    return services.find(
      (service) => service.id === serviceId
    );
  }, [services, serviceId]);

  const selectedHours = useMemo(() => {
    if (!bookingDate) return null;

    const date = new Date(`${bookingDate}T00:00:00`);

    return (
      businessHours.find(
        (hour) => hour.day_of_week === date.getDay()
      ) ?? null
    );
  }, [bookingDate, businessHours]);

  async function loadBookingsForDate(date: string) {
    if (!businessId || !date) {
      setBookings([]);
      return;
    }

    setLoadingSlots(true);
    setBookingTime("");

    const { data, error: bookingsError } =
      await supabase
        .from("bookings")
        .select("booking_time, status")
        .eq("business_id", businessId)
        .eq("booking_date", date)
        .in("status", ["pending", "confirmed"]);

    if (bookingsError) {
      console.error(bookingsError);

      setBookings([]);
      setError(
        "حدث خطأ أثناء تحميل المواعيد المتاحة."
      );

      setLoadingSlots(false);
      return;
    }

    setBookings(data ?? []);
    setLoadingSlots(false);
  }

  useEffect(() => {
    if (!bookingDate) {
      setBookings([]);
      setBookingTime("");
      return;
    }

    if (!selectedHours?.is_open) {
      setBookings([]);
      setBookingTime("");
      return;
    }

    loadBookingsForDate(bookingDate);
  }, [bookingDate, selectedHours]);

  const availableSlots = useMemo(() => {
    if (!selectedHours?.is_open) {
      return [];
    }

    if (!selectedService) {
      return [];
    }

    const duration = Math.max(
      Number(selectedService.duration) || 30,
      5
    );

    const openingTime = timeToMinutes(
      selectedHours.open_time
    );

    const closingTime = timeToMinutes(
      selectedHours.close_time
    );

    const bookedTimes = new Set(
      bookings.map((booking) =>
        booking.booking_time.slice(0, 5)
      )
    );

    const slots: string[] = [];

    for (
      let current = openingTime;
      current + duration <= closingTime;
      current += duration
    ) {
      const slot = minutesToTime(current);

      if (!bookedTimes.has(slot)) {
        slots.push(slot);
      }
    }

    return slots;
  }, [selectedHours, selectedService, bookings]);

  function handleDateChange(value: string) {
    setBookingDate(value);
    setBookingTime("");
    setError("");
  }

  function handleServiceChange(id: string) {
    setServiceId(id);
    setBookingTime("");
    setError("");
  }

  async function handleBooking(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setSuccess(false);

    if (!customerName.trim()) {
      setError("اكتب اسمك.");
      return;
    }

    if (!customerPhone.trim()) {
      setError("اكتب رقم الهاتف.");
      return;
    }

    if (!serviceId) {
      setError("اختر الخدمة.");
      return;
    }

    if (!bookingDate) {
      setError("اختر تاريخ الحجز.");
      return;
    }

    if (!selectedHours) {
      setError(
        "لا توجد مواعيد عمل مسجلة لهذا اليوم."
      );
      return;
    }

    if (!selectedHours.is_open) {
      setError(
        `النشاط مغلق يوم ${
          days[
            new Date(
              `${bookingDate}T00:00:00`
            ).getDay()
          ]
        }.`
      );
      return;
    }

    if (!bookingTime) {
      setError("اختر وقت الحجز.");
      return;
    }

    if (!availableSlots.includes(bookingTime)) {
      setError(
        "هذا الموعد غير متاح. اختر موعدًا آخر."
      );
      return;
    }

    setBooking(true);

    /*
     * Double-check before inserting.
     * This protects against another customer booking
     * the same slot after the page was loaded.
     */
    const { data: existingBooking, error: existingError } =
      await supabase
        .from("bookings")
        .select("id")
        .eq("business_id", businessId)
        .eq("booking_date", bookingDate)
        .eq("booking_time", bookingTime)
        .in("status", ["pending", "confirmed"])
        .maybeSingle();

    if (existingError) {
      console.error(existingError);

      setError(
        "حدث خطأ أثناء التحقق من الموعد."
      );

      setBooking(false);
      return;
    }

    if (existingBooking) {
      setError(
        "للأسف هذا الموعد تم حجزه للتو. اختر موعدًا آخر."
      );

      await loadBookingsForDate(bookingDate);

      setBooking(false);
      return;
    }

    const { error: bookingError } =
      await supabase.from("bookings").insert({
        business_id: businessId,
        service_id: serviceId,
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        customer_email:
          customerEmail.trim() || null,
        booking_date: bookingDate,
        booking_time: bookingTime,
        status: "pending",
        notes: notes.trim() || null,
      });

    if (bookingError) {
      console.error(bookingError);

      setError(
        "لم نتمكن من إنشاء الحجز. حاول مرة أخرى."
      );

      setBooking(false);
      return;
    }

    setBooking(false);
    setSuccess(true);

    setCustomerName("");
    setCustomerPhone("");
    setCustomerEmail("");
    setBookingDate("");
    setBookingTime("");
    setNotes("");
    setBookings([]);
  }

  if (loading) {
    return (
      <main
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-slate-950"
      >
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-slate-700 border-t-blue-500" />

          <p className="mt-4 text-sm text-slate-400">
            جاري تحميل صفحة الحجز...
          </p>
        </div>
      </main>
    );
  }

  if (!business) {
    return (
      <main
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-slate-100 px-6"
      >
        <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-sm">
          <div className="text-5xl">🏪</div>

          <h1 className="mt-5 text-2xl font-bold">
            النشاط غير موجود
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-500">
            تأكد من أن رابط الحجز صحيح.
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
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-6 py-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-2xl font-bold tracking-tight">
                Booking<span className="text-blue-600">OS</span>
              </div>

              <p className="mt-1 text-xs text-slate-400">
                حجز موعدك بسهولة
              </p>
            </div>

            <div className="rounded-full bg-blue-50 px-4 py-2 text-xs font-semibold text-blue-600">
              حجز أونلاين
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-10">
        <section className="rounded-3xl bg-slate-900 p-8 text-white shadow-sm">
          <div className="max-w-3xl">
            <p className="text-sm font-medium text-blue-400">
              مرحبًا بك في
            </p>

            <h1 className="mt-2 text-4xl font-bold">
              {business.name}
            </h1>

            {business.description && (
              <p className="mt-4 max-w-2xl leading-7 text-slate-400">
                {business.description}
              </p>
            )}
          </div>
        </section>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_1.2fr]">
          <section>
            <div className="mb-5">
              <h2 className="text-xl font-bold">
                الخدمات المتاحة
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                اختر الخدمة التي تريد حجزها.
              </p>
            </div>

            {services.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                <div className="text-4xl">🛎️</div>

                <h3 className="mt-4 font-bold">
                  لا توجد خدمات متاحة حاليًا
                </h3>

                <p className="mt-2 text-sm text-slate-500">
                  لم يقم النشاط بإضافة خدمات بعد.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {services.map((service) => (
                  <button
                    key={service.id}
                    type="button"
                    onClick={() =>
                      handleServiceChange(service.id)
                    }
                    className={`w-full rounded-2xl border p-5 text-right transition ${
                      serviceId === service.id
                        ? "border-blue-500 bg-blue-50 ring-2 ring-blue-500/10"
                        : "border-slate-200 bg-white hover:border-blue-200"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-bold">
                          {service.name}
                        </h3>

                        {service.description && (
                          <p className="mt-2 text-sm leading-6 text-slate-500">
                            {service.description}
                          </p>
                        )}
                      </div>

                      <div className="text-left">
                        <p className="font-bold text-blue-600">
                          {service.price ?? 0} ج.م
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          {service.duration ?? 30} دقيقة
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>

          <section>
            <div className="mb-5">
              <h2 className="text-xl font-bold">
                احجز موعدك
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                اختر الخدمة والتاريخ والموعد المناسب.
              </p>
            </div>

            {success ? (
              <div className="rounded-3xl border border-green-200 bg-green-50 p-8 text-center">
                <div className="text-6xl">✅</div>

                <h2 className="mt-5 text-2xl font-bold text-green-800">
                  تم إرسال الحجز بنجاح
                </h2>

                <p className="mt-3 text-sm leading-6 text-green-700">
                  تم تسجيل طلب الحجز. سيتم التواصل معك
                  لتأكيد الموعد.
                </p>

                <button
                  type="button"
                  onClick={() => setSuccess(false)}
                  className="mt-6 rounded-xl bg-green-600 px-6 py-3 font-semibold text-white transition hover:bg-green-700"
                >
                  حجز موعد آخر
                </button>
              </div>
            ) : (
              <form
                onSubmit={handleBooking}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
              >
                <div className="space-y-5">
                  <div>
                    <label
                      htmlFor="customerName"
                      className="mb-2 block text-sm font-semibold"
                    >
                      الاسم *
                    </label>

                    <input
                      id="customerName"
                      type="text"
                      required
                      value={customerName}
                      onChange={(event) =>
                        setCustomerName(
                          event.target.value
                        )
                      }
                      placeholder="اكتب اسمك"
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="customerPhone"
                      className="mb-2 block text-sm font-semibold"
                    >
                      رقم الهاتف *
                    </label>

                    <input
                      id="customerPhone"
                      type="tel"
                      required
                      value={customerPhone}
                      onChange={(event) =>
                        setCustomerPhone(
                          event.target.value
                        )
                      }
                      placeholder="01xxxxxxxxx"
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="customerEmail"
                      className="mb-2 block text-sm font-semibold"
                    >
                      البريد الإلكتروني
                    </label>

                    <input
                      id="customerEmail"
                      type="email"
                      value={customerEmail}
                      onChange={(event) =>
                        setCustomerEmail(
                          event.target.value
                        )
                      }
                      placeholder="example@email.com"
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="bookingDate"
                      className="mb-2 block text-sm font-semibold"
                    >
                      تاريخ الحجز *
                    </label>

                    <input
                      id="bookingDate"
                      type="date"
                      required
                      min={
                        new Date()
                          .toISOString()
                          .split("T")[0]
                      }
                      value={bookingDate}
                      onChange={(event) =>
                        handleDateChange(
                          event.target.value
                        )
                      }
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                    />

                    {bookingDate && selectedHours && (
                      <p
                        className={`mt-2 text-sm ${
                          selectedHours.is_open
                            ? "text-green-600"
                            : "text-red-500"
                        }`}
                      >
                        {selectedHours.is_open
                          ? `مفتوح من ${selectedHours.open_time.slice(
                              0,
                              5
                            )} إلى ${selectedHours.close_time.slice(
                              0,
                              5
                            )}`
                          : `النشاط مغلق يوم ${
                              days[
                                new Date(
                                  `${bookingDate}T00:00:00`
                                ).getDay()
                              ]
                            }`}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold">
                      اختر الموعد *
                    </label>

                    {!bookingDate ? (
                      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-center text-sm text-slate-500">
                        اختر التاريخ أولًا.
                      </div>
                    ) : !selectedHours?.is_open ? (
                      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-5 text-center text-sm text-red-600">
                        النشاط مغلق في هذا اليوم.
                      </div>
                    ) : loadingSlots ? (
                      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-5 text-center text-sm text-slate-500">
                        جاري تحميل المواعيد...
                      </div>
                    ) : availableSlots.length === 0 ? (
                      <div className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-5 text-center text-sm text-orange-700">
                        لا توجد مواعيد متاحة في هذا اليوم.
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {availableSlots.map((slot) => (
                          <button
                            key={slot}
                            type="button"
                            onClick={() =>
                              setBookingTime(slot)
                            }
                            className={`rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                              bookingTime === slot
                                ? "border-blue-600 bg-blue-600 text-white"
                                : "border-slate-200 bg-white text-slate-700 hover:border-blue-400 hover:bg-blue-50"
                            }`}
                          >
                            {slot}
                          </button>
                        ))}
                      </div>
                    )}

                    {selectedService && bookingDate && (
                      <p className="mt-3 text-xs text-slate-400">
                        مدة الخدمة:{" "}
                        {selectedService.duration ?? 30} دقيقة
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="notes"
                      className="mb-2 block text-sm font-semibold"
                    >
                      ملاحظات
                    </label>

                    <textarea
                      id="notes"
                      rows={4}
                      value={notes}
                      onChange={(event) =>
                        setNotes(event.target.value)
                      }
                      placeholder="أي ملاحظات إضافية..."
                      className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                    />
                  </div>

                  {error && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-600">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={
                      booking ||
                      services.length === 0 ||
                      !bookingTime ||
                      !selectedHours?.is_open
                    }
                    className="w-full rounded-xl bg-blue-600 px-6 py-4 font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {booking
                      ? "جاري إرسال الحجز..."
                      : "احجز الآن"}
                  </button>
                </div>
              </form>
            )}
          </section>
        </div>
      </div>

      <footer className="border-t border-slate-200 bg-white py-6">
        <p className="text-center text-xs text-slate-400">
          Powered by BookingOS
        </p>
      </footer>
    </main>
  );
}