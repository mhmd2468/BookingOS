"use client";

import { FormEvent, use, useEffect, useState } from "react";
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

type BookingRecord = {
  booking_time: string;
  service_id: string;
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

const SLOT_INTERVAL = 30;

export default function PublicBookingPage({
  params,
}: {
  params: Promise<{ businessId: string }>;
}) {
  const { businessId } = use(params);

  const [business, setBusiness] = useState<Business | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [businessHours, setBusinessHours] = useState<BusinessHour[]>([]);
  const [bookingsForDate, setBookingsForDate] = useState<
    BookingRecord[]
  >([]);

  const [serviceId, setServiceId] = useState("");
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("");

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(true);
  const [loadingTimes, setLoadingTimes] = useState(false);
  const [booking, setBooking] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // =========================
  // Load Business
  // =========================

  useEffect(() => {
    async function loadPage() {
      setLoading(true);
      setError("");

      const {
        data: businessData,
        error: businessError,
      } = await supabase
        .from("businesses")
        .select(
          "id, name, type, phone, email, description"
        )
        .eq("id", businessId)
        .maybeSingle();

      if (businessError) {
        console.error("BUSINESS ERROR:", businessError);
        setError("حدث خطأ أثناء تحميل بيانات النشاط.");
        setLoading(false);
        return;
      }

      if (!businessData) {
        setError("هذا النشاط غير موجود.");
        setLoading(false);
        return;
      }

      setBusiness(businessData);

      // =========================
      // Load Services
      // =========================

      const {
        data: servicesData,
        error: servicesError,
      } = await supabase
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
        console.error("SERVICES ERROR:", servicesError);

        setError(
          "حدث خطأ أثناء تحميل الخدمات."
        );

        setLoading(false);
        return;
      }

      setServices(servicesData ?? []);

      if (servicesData && servicesData.length > 0) {
        setServiceId(servicesData[0].id);
      }

      // =========================
      // Load Business Hours
      // =========================

      const {
        data: hoursData,
        error: hoursError,
      } = await supabase
        .from("business_hours")
        .select(
          "day_of_week, is_open, open_time, close_time"
        )
        .eq("business_id", businessId)
        .order("day_of_week", {
          ascending: true,
        });

      if (hoursError) {
        console.error("HOURS ERROR:", hoursError);

        setError(
          "حدث خطأ أثناء تحميل مواعيد العمل."
        );

        setLoading(false);
        return;
      }

      setBusinessHours(hoursData ?? []);

      setLoading(false);
    }

    if (businessId) {
      loadPage();
    }
  }, [businessId]);

  // =========================
  // Load Bookings For Date
  // =========================

  useEffect(() => {
    if (!bookingDate) {
      setBookingsForDate([]);
      setBookingTime("");
      return;
    }

    loadBookingsForDate(bookingDate);
  }, [bookingDate, businessId]);

  async function loadBookingsForDate(date: string) {
    setLoadingTimes(true);
    setBookingTime("");
    setError("");

    const {
      data,
      error: bookingsError,
    } = await supabase.rpc(
      "get_booked_times",
      {
        p_business_id: businessId,
        p_booking_date: date,
      }
    );

    if (bookingsError) {
      console.error(
        "BOOKINGS ERROR:",
        bookingsError
      );

      setBookingsForDate([]);

      setError(
        "حدث خطأ أثناء تحميل المواعيد المتاحة."
      );

      setLoadingTimes(false);
      return;
    }

    setBookingsForDate(data ?? []);
    setLoadingTimes(false);
  }

  // =========================
  // Helpers
  // =========================

  function timeToMinutes(time: string) {
    const [hours, minutes] = time
      .slice(0, 5)
      .split(":")
      .map(Number);

    return hours * 60 + minutes;
  }

  function minutesToTime(minutes: number) {
    const hours = Math.floor(minutes / 60)
      .toString()
      .padStart(2, "0");

    const mins = (minutes % 60)
      .toString()
      .padStart(2, "0");

    return `${hours}:${mins}`;
  }

  function getTodayDate() {
    const today = new Date();

    const year = today.getFullYear();
    const month = String(
      today.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
      today.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  function getSelectedService() {
    return (
      services.find(
        (service) => service.id === serviceId
      ) ?? null
    );
  }

  function getSelectedDayIndex() {
    if (!bookingDate) return null;

    const date = new Date(
      `${bookingDate}T00:00:00`
    );

    return date.getDay();
  }

  function getSelectedDayHours() {
    const dayIndex = getSelectedDayIndex();

    if (dayIndex === null) {
      return null;
    }

    return (
      businessHours.find(
        (hour) =>
          hour.day_of_week === dayIndex
      ) ?? null
    );
  }

  // =========================
  // Available Times
  // =========================

  function getAvailableTimes() {
    if (!bookingDate) {
      return [];
    }

    const selectedHours =
      getSelectedDayHours();

    if (
      !selectedHours ||
      !selectedHours.is_open
    ) {
      return [];
    }

    const selectedService =
      getSelectedService();

    if (!selectedService) {
      return [];
    }

    const openMinutes =
      timeToMinutes(
        selectedHours.open_time
      );

    const closeMinutes =
      timeToMinutes(
        selectedHours.close_time
      );

    const duration =
      selectedService.duration ?? 30;

    const availableTimes: string[] = [];

    for (
      let start = openMinutes;
      start + duration <= closeMinutes;
      start += SLOT_INTERVAL
    ) {
      const selectedStart = start;
      const selectedEnd =
        start + duration;

      const hasConflict =
        bookingsForDate.some(
          (booking) => {
            const bookedStart =
              timeToMinutes(
                booking.booking_time
              );

            const bookedService =
              services.find(
                (service) =>
                  service.id ===
                  booking.service_id
              );

            const bookedDuration =
              bookedService?.duration ??
              30;

            const bookedEnd =
              bookedStart +
              bookedDuration;

            return (
              selectedStart <
                bookedEnd &&
              selectedEnd >
                bookedStart
            );
          }
        );

      if (!hasConflict) {
        availableTimes.push(
          minutesToTime(start)
        );
      }
    }

    return availableTimes;
  }

  // =========================
  // Date Change
  // =========================

  function handleDateChange(
    value: string
  ) {
    setBookingDate(value);
    setBookingTime("");
    setError("");
    setSuccess(false);
  }

  // =========================
  // Service Change
  // =========================

  function handleServiceChange(
    id: string
  ) {
    setServiceId(id);
    setBookingTime("");
    setError("");
    setSuccess(false);
  }

  // =========================
  // Booking
  // =========================

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

    if (!bookingTime) {
      setError("اختر وقت الحجز.");
      return;
    }

    const today = getTodayDate();

    if (bookingDate < today) {
      setError(
        "لا يمكن اختيار تاريخ سابق."
      );
      return;
    }

    const selectedHours =
      getSelectedDayHours();

    if (!selectedHours) {
      setError(
        "لا توجد مواعيد عمل مسجلة لهذا اليوم."
      );
      return;
    }

    if (!selectedHours.is_open) {
      const dayIndex =
        getSelectedDayIndex();

      if (dayIndex !== null) {
        setError(
          `النشاط مغلق يوم ${days[dayIndex]}.`
        );
      } else {
        setError(
          "النشاط مغلق في هذا اليوم."
        );
      }

      return;
    }

    const availableTimes =
      getAvailableTimes();

    if (
      !availableTimes.includes(
        bookingTime
      )
    ) {
      setError(
        "هذا الموعد غير متاح. اختر موعدًا آخر."
      );

      await loadBookingsForDate(
        bookingDate
      );

      return;
    }

    setBooking(true);

    // =========================
    // Final Availability Check
    // =========================

    const {
      data: existingBookings,
      error: existingError,
    } = await supabase
      .from("bookings")
      .select(
        "id, booking_time, service_id, status"
      )
      .eq("business_id", businessId)
      .eq("booking_date", bookingDate)
      .neq("status", "cancelled");

    if (existingError) {
      console.error(
        "FINAL CHECK ERROR:",
        existingError
      );

      setError(
        "حدث خطأ أثناء التحقق من الموعد."
      );

      setBooking(false);
      return;
    }

    const selectedService =
      getSelectedService();

    const selectedDuration =
      selectedService?.duration ?? 30;

    const selectedStart =
      timeToMinutes(
        bookingTime
      );

    const selectedEnd =
      selectedStart +
      selectedDuration;

    const hasConflict =
      (existingBookings ?? []).some(
        (existingBooking) => {
          const bookedStart =
            timeToMinutes(
              existingBooking.booking_time
            );

          const bookedService =
            services.find(
              (service) =>
                service.id ===
                existingBooking.service_id
            );

          const bookedDuration =
            bookedService?.duration ??
            30;

          const bookedEnd =
            bookedStart +
            bookedDuration;

          return (
            selectedStart <
              bookedEnd &&
            selectedEnd >
              bookedStart
          );
        }
      );

    if (hasConflict) {
      setError(
        "هذا الموعد تم حجزه للتو. اختر موعدًا آخر."
      );

      await loadBookingsForDate(
        bookingDate
      );

      setBooking(false);
      return;
    }

    // =========================
    // Create Booking
    // =========================

    const {
      error: bookingError,
    } = await supabase
      .from("bookings")
      .insert({
        business_id: businessId,
        service_id: serviceId,
        customer_name:
          customerName.trim(),
        customer_phone:
          customerPhone.trim(),
        customer_email:
          customerEmail.trim() ||
          null,
        booking_date:
          bookingDate,
        booking_time:
          bookingTime,
        status: "pending",
        notes:
          notes.trim() || null,
      });

    if (bookingError) {
      console.error(
        "BOOKING ERROR:",
        bookingError
      );

      setError(
        "لم نتمكن من إنشاء الحجز. حاول مرة أخرى."
      );

      setBooking(false);
      return;
    }

    setSuccess(true);

    setCustomerName("");
    setCustomerPhone("");
    setCustomerEmail("");
    setBookingDate("");
    setBookingTime("");
    setNotes("");
    setBookingsForDate([]);

    setBooking(false);
  }

  const selectedHours =
    getSelectedDayHours();

  const availableTimes =
    getAvailableTimes();

  const selectedService =
    getSelectedService();

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
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-slate-700 border-t-blue-500" />

          <p className="mt-4 text-sm text-slate-400">
            جاري تحميل صفحة الحجز...
          </p>
        </div>
      </main>
    );
  }

  // =========================
  // Business Not Found
  // =========================

  if (!business) {
    return (
      <main
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-slate-100 px-6"
      >
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="text-5xl">
            🏪
          </div>

          <h1 className="mt-5 text-2xl font-bold">
            النشاط غير موجود
          </h1>

          <p className="mt-3 text-sm leading-7 text-slate-500">
            {error ||
              "تأكد من أن رابط الحجز صحيح."}
          </p>
        </div>
      </main>
    );
  }

  // =========================
  // Page
  // =========================

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-slate-100 text-slate-900"
    >
      {/* Header */}

      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-6 py-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-2xl font-bold tracking-tight">
                Booking
                <span className="text-blue-600">
                  OS
                </span>
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
        {/* Business Hero */}

        <section className="rounded-3xl bg-slate-900 p-8 text-white shadow-sm">
          <div className="max-w-3xl">
            <p className="text-sm font-medium text-blue-400">
              مرحبًا بك في
            </p>

            <h1 className="mt-2 text-4xl font-bold">
              {business.name}
            </h1>

            {business.type && (
              <p className="mt-2 text-sm text-blue-300">
                {business.type}
              </p>
            )}

            {business.description && (
              <p className="mt-4 max-w-2xl leading-7 text-slate-400">
                {business.description}
              </p>
            )}
          </div>
        </section>

        {/* Error */}

        {error && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm leading-7 text-red-700">
            {error}
          </div>
        )}

        {/* Main */}

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_1.2fr]">
          {/* Services */}

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
                <div className="text-4xl">
                  🛎️
                </div>

                <h3 className="mt-4 font-bold">
                  لا توجد خدمات متاحة حاليًا
                </h3>

                <p className="mt-2 text-sm text-slate-500">
                  لم يقم النشاط بإضافة خدمات بعد.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {services.map(
                  (service) => (
                    <button
                      key={service.id}
                      type="button"
                      onClick={() =>
                        handleServiceChange(
                          service.id
                        )
                      }
                      className={`w-full rounded-2xl border p-5 text-right transition ${
                        serviceId ===
                        service.id
                          ? "border-blue-500 bg-blue-50 ring-2 ring-blue-500/10"
                          : "border-slate-200 bg-white hover:border-blue-200 hover:shadow-sm"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <h3 className="font-bold">
                            {
                              service.name
                            }
                          </h3>

                          {service.description && (
                            <p className="mt-2 text-sm leading-6 text-slate-500">
                              {
                                service.description
                              }
                            </p>
                          )}
                        </div>

                        {serviceId ===
                          service.id && (
                          <span className="text-xl font-bold text-blue-600">
                            ✓
                          </span>
                        )}
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {service.price !==
                          null && (
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                            {
                              service.price
                            }{" "}
                            ج.م
                          </span>
                        )}

                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                          {service.duration ??
                            30}{" "}
                          دقيقة
                        </span>
                      </div>
                    </button>
                  )
                )}
              </div>
            )}
          </section>

          {/* Booking */}

          <section>
            <div className="mb-5">
              <h2 className="text-xl font-bold">
                احجز موعدك
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                املأ بياناتك واختر الموعد المناسب لك.
              </p>
            </div>

            {success ? (
              <div className="rounded-3xl border border-green-200 bg-green-50 p-8 text-center">
                <div className="text-6xl">
                  ✅
                </div>

                <h2 className="mt-5 text-2xl font-bold text-green-800">
                  تم إرسال الحجز بنجاح
                </h2>

                <p className="mt-3 text-sm leading-7 text-green-700">
                  تم تسجيل طلب الحجز بنجاح.
                  <br />
                  سيتم التواصل معك لتأكيد الموعد.
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setSuccess(false);

                    if (
                      services.length >
                      0
                    ) {
                      setServiceId(
                        services[0].id
                      );
                    }
                  }}
                  className="mt-6 rounded-xl bg-green-600 px-6 py-3 font-semibold text-white transition hover:bg-green-700"
                >
                  حجز موعد آخر
                </button>
              </div>
            ) : (
              <form
                onSubmit={
                  handleBooking
                }
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
              >
                <div className="space-y-5">
                  {/* Name */}

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
                      value={
                        customerName
                      }
                      onChange={(event) =>
                        setCustomerName(
                          event.target
                            .value
                        )
                      }
                      placeholder="اكتب اسمك"
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                    />
                  </div>

                  {/* Phone */}

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
                      value={
                        customerPhone
                      }
                      onChange={(event) =>
                        setCustomerPhone(
                          event.target
                            .value
                        )
                      }
                      placeholder="01xxxxxxxxx"
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                    />
                  </div>

                  {/* Email */}

                  <div>
                    <label
                      htmlFor="customerEmail"
                      className="mb-2 block text-sm font-semibold"
                    >
                      البريد الإلكتروني
                      <span className="mr-1 text-xs font-normal text-slate-400">
                        اختياري
                      </span>
                    </label>

                    <input
                      id="customerEmail"
                      type="email"
                      value={
                        customerEmail
                      }
                      onChange={(event) =>
                        setCustomerEmail(
                          event.target
                            .value
                        )
                      }
                      placeholder="example@email.com"
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                    />
                  </div>

                  {/* Date */}

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
                      min={getTodayDate()}
                      value={
                        bookingDate
                      }
                      onChange={(event) =>
                        handleDateChange(
                          event.target
                            .value
                        )
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                    />

                    {bookingDate && (
                      <div className="mt-2 text-sm">
                        {!selectedHours ? (
                          <p className="text-red-500">
                            لا توجد مواعيد عمل مسجلة لهذا اليوم.
                          </p>
                        ) : selectedHours.is_open ? (
                          <p className="text-green-600">
                            مفتوح من{" "}
                            {selectedHours.open_time.slice(
                              0,
                              5
                            )}{" "}
                            إلى{" "}
                            {selectedHours.close_time.slice(
                              0,
                              5
                            )}
                          </p>
                        ) : (
                          <p className="text-red-500">
                            النشاط مغلق يوم{" "}
                            {
                              days[
                                getSelectedDayIndex() ??
                                  0
                              ]
                            }
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Time */}

                  <div>
                    <label className="mb-2 block text-sm font-semibold">
                      وقت الحجز *
                    </label>

                    {!bookingDate ? (
                      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm text-slate-400">
                        اختر التاريخ أولًا لمعرفة المواعيد المتاحة.
                      </div>
                    ) : !selectedHours ||
                      !selectedHours.is_open ? (
                      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-600">
                        لا توجد مواعيد متاحة في هذا اليوم.
                      </div>
                    ) : loadingTimes ? (
                      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-500">
                        جاري تحميل المواعيد المتاحة...
                      </div>
                    ) : availableTimes.length ===
                      0 ? (
                      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-700">
                        لا توجد مواعيد متاحة لهذا اليوم.
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {availableTimes.map(
                          (time) => (
                            <button
                              key={time}
                              type="button"
                              onClick={() =>
                                setBookingTime(
                                  time
                                )
                              }
                              className={`rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                                bookingTime ===
                                time
                                  ? "border-blue-600 bg-blue-600 text-white"
                                  : "border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50"
                              }`}
                            >
                              {time}
                            </button>
                          )
                        )}
                      </div>
                    )}
                  </div>

                  {/* Notes */}

                  <div>
                    <label
                      htmlFor="notes"
                      className="mb-2 block text-sm font-semibold"
                    >
                      ملاحظات
                      <span className="mr-1 text-xs font-normal text-slate-400">
                        اختياري
                      </span>
                    </label>

                    <textarea
                      id="notes"
                      rows={4}
                      value={notes}
                      onChange={(event) =>
                        setNotes(
                          event.target
                            .value
                        )
                      }
                      placeholder="أي ملاحظات إضافية..."
                      className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                    />
                  </div>

                  {/* Summary */}

                  {selectedService &&
                    bookingDate &&
                    bookingTime && (
                      <div className="rounded-2xl bg-blue-50 p-5">
                        <p className="text-sm font-semibold text-blue-600">
                          ملخص الحجز
                        </p>

                        <div className="mt-3 space-y-2 text-sm text-slate-700">
                          <p>
                            <span className="font-semibold">
                              الخدمة:
                            </span>{" "}
                            {
                              selectedService.name
                            }
                          </p>

                          <p>
                            <span className="font-semibold">
                              التاريخ:
                            </span>{" "}
                            {bookingDate}
                          </p>

                          <p>
                            <span className="font-semibold">
                              الوقت:
                            </span>{" "}
                            {bookingTime}
                          </p>

                          {selectedService.price !==
                            null && (
                            <p>
                              <span className="font-semibold">
                                السعر:
                              </span>{" "}
                              {
                                selectedService.price
                              }{" "}
                              ج.م
                            </p>
                          )}

                          <p>
                            <span className="font-semibold">
                              المدة:
                            </span>{" "}
                            {selectedService.duration ??
                              30}{" "}
                            دقيقة
                          </p>
                        </div>
                      </div>
                    )}

                  {/* Submit */}

                  <button
                    type="submit"
                    disabled={
                      booking ||
                      services.length ===
                        0 ||
                      !bookingDate ||
                      !selectedHours?.is_open ||
                      !bookingTime ||
                      availableTimes.length ===
                        0
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

        {/* Contact */}

        {(business.phone ||
          business.email) && (
          <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="font-bold">
              تواصل مع النشاط
            </h2>

            <div className="mt-4 flex flex-wrap gap-3">
              {business.phone && (
                <a
                  href={`tel:${business.phone}`}
                  className="rounded-xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
                >
                  📞 {business.phone}
                </a>
              )}

              {business.email && (
                <a
                  href={`mailto:${business.email}`}
                  className="rounded-xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
                >
                  ✉️ {business.email}
                </a>
              )}
            </div>
          </section>
        )}

        {/* Footer */}

        <footer className="py-8 text-center text-xs text-slate-400">
          Powered by BookingOS
        </footer>
      </div>
    </main>
  );
}