"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";
import { supabase } from "@/lib/supabase";

type BusinessHour = {
  day_of_week: number;
  is_open: boolean;
  open_time: string;
  close_time: string;
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

const defaultHours: BusinessHour[] = days.map((_, index) => ({
  day_of_week: index,
  is_open: index !== 5,
  open_time: "09:00",
  close_time: "21:00",
}));

export default function BusinessPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [businessId, setBusinessId] = useState("");

  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [description, setDescription] = useState("");

  const [businessHours, setBusinessHours] =
    useState<BusinessHour[]>(defaultHours);

  const [bookingUrl, setBookingUrl] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [copied, setCopied] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function loadBusiness() {
      setLoading(true);
      setError("");

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      const { data, error: businessError } = await supabase
        .from("businesses")
        .select("*")
        .eq("owner_id", user.id)
        .maybeSingle();

      if (businessError) {
        console.error(businessError);

        setError("حدث خطأ أثناء تحميل بيانات النشاط.");
        setLoading(false);
        return;
      }

      if (data) {
        setBusinessId(data.id);
        setName(data.name ?? "");
        setType(data.type ?? "");
        setPhone(data.phone ?? "");
        setEmail(data.email ?? "");
        setDescription(data.description ?? "");

        const { data: hoursData, error: hoursError } =
          await supabase
            .from("business_hours")
            .select(
              "day_of_week, is_open, open_time, close_time"
            )
            .eq("business_id", data.id)
            .order("day_of_week", {
              ascending: true,
            });

        if (hoursError) {
          console.error(hoursError);

          setError(
            "تم تحميل بيانات النشاط، لكن حدث خطأ أثناء تحميل مواعيد العمل."
          );
        } else if (hoursData && hoursData.length > 0) {
          const mergedHours = defaultHours.map(
            (defaultHour) => {
              const savedHour = hoursData.find(
                (hour) =>
                  hour.day_of_week ===
                  defaultHour.day_of_week
              );

              if (!savedHour) {
                return defaultHour;
              }

              return {
                day_of_week: savedHour.day_of_week,
                is_open: savedHour.is_open,
                open_time:
                  savedHour.open_time?.slice(0, 5) ??
                  defaultHour.open_time,
                close_time:
                  savedHour.close_time?.slice(0, 5) ??
                  defaultHour.close_time,
              };
            }
          );

          setBusinessHours(mergedHours);
        }
      }

      setLoading(false);
    }

    loadBusiness();
  }, [router]);

  /*
   * إنشاء رابط الحجز و QR Code
   */
  useEffect(() => {
    if (!businessId) {
      setBookingUrl("");
      setQrCodeUrl("");
      return;
    }

    const url = `${window.location.origin}/book/${businessId}`;

    setBookingUrl(url);

    QRCode.toDataURL(url, {
      width: 600,
      margin: 2,
      errorCorrectionLevel: "H",
    })
      .then((dataUrl) => {
        setQrCodeUrl(dataUrl);
      })
      .catch((error) => {
        console.error("QR Code error:", error);
        setQrCodeUrl("");
      });
  }, [businessId]);

  function updateBusinessHour(
    dayIndex: number,
    field: keyof BusinessHour,
    value: boolean | string | number
  ) {
    setBusinessHours((currentHours) =>
      currentHours.map((hour) =>
        hour.day_of_week === dayIndex
          ? {
              ...hour,
              [field]: value,
            }
          : hour
      )
    );
  }

  /*
   * نسخ رابط الحجز
   */
  async function copyBookingLink() {
    if (!bookingUrl) return;

    try {
      await navigator.clipboard.writeText(bookingUrl);

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error("Copy error:", error);
    }
  }

  /*
   * تحميل QR Code
   */
  function downloadQRCode() {
    if (!qrCodeUrl) return;

    const link = document.createElement("a");

    link.href = qrCodeUrl;
    link.download = `${name || "bookingos"}-qr-code.png`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /*
   * طباعة QR Code
   */
  function printQRCode() {
    if (!qrCodeUrl) return;

    const printWindow = window.open(
      "",
      "_blank",
      "width=800,height=900"
    );

    if (!printWindow) {
      setError(
        "المتصفح منع نافذة الطباعة. اسمح بالنوافذ المنبثقة ثم حاول مرة أخرى."
      );
      return;
    }

    const safeName = name || "BookingOS";

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
        <head>
          <meta charset="UTF-8" />
          <title>QR Code - ${safeName}</title>

          <style>
            * {
              box-sizing: border-box;
            }

            body {
              margin: 0;
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
              background: white;
              font-family: Arial, sans-serif;
            }

            .card {
              text-align: center;
              padding: 40px;
            }

            img {
              width: 360px;
              height: 360px;
              object-fit: contain;
            }

            h1 {
              margin: 25px 0 10px;
              font-size: 30px;
              color: #0f172a;
            }

            p {
              margin: 0;
              color: #64748b;
              font-size: 17px;
            }

            .brand {
              margin-top: 25px;
              font-size: 14px;
              color: #2563eb;
              font-weight: bold;
            }

            @media print {
              body {
                min-height: auto;
              }
            }
          </style>
        </head>

        <body>
          <div class="card">
            <img
              src="${qrCodeUrl}"
              alt="QR Code"
            />

            <h1>${safeName}</h1>

            <p>
              امسح الكود للحجز
            </p>

            <div class="brand">
              Powered by BookingOS
            </div>
          </div>

          <script>
            window.onload = function () {
              window.print();
            };
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
  }

  async function handleSave(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");
    setSaving(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.replace("/login");
      return;
    }

    if (!name.trim()) {
      setError("اكتب اسم النشاط.");
      setSaving(false);
      return;
    }

    if (!type) {
      setError("اختر نوع النشاط.");
      setSaving(false);
      return;
    }

    for (const hour of businessHours) {
      if (!hour.is_open) continue;

      if (!hour.open_time || !hour.close_time) {
        setError(
          `حدد وقت الفتح والإغلاق ليوم ${days[hour.day_of_week]}.`
        );

        setSaving(false);
        return;
      }

      if (hour.open_time >= hour.close_time) {
        setError(
          `وقت الإغلاق يجب أن يكون بعد وقت الفتح ليوم ${days[hour.day_of_week]}.`
        );

        setSaving(false);
        return;
      }
    }

    const {
      data: existingBusiness,
      error: checkError,
    } = await supabase
      .from("businesses")
      .select("id")
      .eq("owner_id", user.id)
      .maybeSingle();

    if (checkError) {
      console.error(checkError);

      setError(
        "حدث خطأ أثناء التحقق من بيانات النشاط."
      );

      setSaving(false);
      return;
    }

    let currentBusinessId = businessId;

    if (existingBusiness) {
      currentBusinessId = existingBusiness.id;

      const { error: updateError } =
        await supabase
          .from("businesses")
          .update({
            name: name.trim(),
            type,
            phone: phone.trim(),
            email: email.trim(),
            description: description.trim(),
          })
          .eq("id", existingBusiness.id)
          .eq("owner_id", user.id);

      if (updateError) {
        console.error(updateError);

        setError(
          "لم نتمكن من تحديث بيانات النشاط."
        );

        setSaving(false);
        return;
      }
    } else {
      const {
        data: newBusiness,
        error: insertError,
      } = await supabase
        .from("businesses")
        .insert({
          owner_id: user.id,
          name: name.trim(),
          type,
          phone: phone.trim(),
          email: email.trim(),
          description: description.trim(),
        })
        .select("id")
        .single();

      if (insertError || !newBusiness) {
        console.error(insertError);

        setError(
          "لم نتمكن من حفظ بيانات النشاط."
        );

        setSaving(false);
        return;
      }

      currentBusinessId = newBusiness.id;

      setBusinessId(newBusiness.id);
    }

    const hoursToSave = businessHours.map((hour) => ({
      business_id: currentBusinessId,
      day_of_week: hour.day_of_week,
      is_open: hour.is_open,
      open_time: hour.open_time,
      close_time: hour.close_time,
    }));

    const { error: hoursError } =
      await supabase
        .from("business_hours")
        .upsert(hoursToSave, {
          onConflict:
            "business_id,day_of_week",
        });

    if (hoursError) {
      console.error(hoursError);

      setError(
        "تم حفظ بيانات النشاط، لكن لم نتمكن من حفظ مواعيد العمل."
      );

      setSaving(false);
      return;
    }

    setSaving(false);

    setSuccess(
      "تم حفظ بيانات النشاط ومواعيد العمل بنجاح ✅"
    );
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
            جاري تحميل بيانات النشاط...
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
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <div>
            <div className="text-2xl font-bold tracking-tight">
              Booking
              <span className="text-blue-600">OS</span>
            </div>

            <p className="mt-1 text-sm text-slate-500">
              إعداد النشاط
            </p>
          </div>

          <button
            onClick={() =>
              router.push("/dashboard")
            }
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            العودة للوحة التحكم
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-10">
        <div className="mb-8">
          <p className="text-sm font-semibold text-blue-600">
            إعداد النشاط
          </p>

          <h1 className="mt-2 text-3xl font-bold">
            بيانات نشاطك التجاري
          </h1>

          <p className="mt-3 max-w-2xl leading-7 text-slate-500">
            أدخل بيانات نشاطك الأساسية وحدد مواعيد
            العمل التي يستطيع العملاء الحجز خلالها.
          </p>
        </div>

        <form
          onSubmit={handleSave}
          className="space-y-8"
        >
          {/* Business Information */}

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-6">
              <h2 className="text-xl font-bold">
                بيانات النشاط
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                البيانات الأساسية التي ستظهر للعملاء.
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <label
                  htmlFor="name"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  اسم النشاط
                </label>

                <input
                  id="name"
                  type="text"
                  required
                  value={name}
                  onChange={(event) =>
                    setName(event.target.value)
                  }
                  placeholder="مثال: عيادة دكتور علي"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                />
              </div>

              <div>
                <label
                  htmlFor="type"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  نوع النشاط
                </label>

                <select
                  id="type"
                  required
                  value={type}
                  onChange={(event) =>
                    setType(event.target.value)
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                >
                  <option value="">
                    اختر نوع النشاط
                  </option>

                  <option value="doctor">
                    عيادة / طبيب
                  </option>

                  <option value="salon">
                    صالون
                  </option>

                  <option value="beauty_center">
                    مركز تجميل
                  </option>

                  <option value="football">
                    ملعب كرة قدم
                  </option>

                  <option value="trainer">
                    مدرب
                  </option>

                  <option value="teacher">
                    مدرس
                  </option>

                  <option value="photographer">
                    مصور
                  </option>

                  <option value="training_center">
                    مركز تدريب
                  </option>

                  <option value="other">
                    نشاط آخر
                  </option>
                </select>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label
                    htmlFor="phone"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    رقم الهاتف
                  </label>

                  <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(event) =>
                      setPhone(event.target.value)
                    }
                    placeholder="01xxxxxxxxx"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  />
                </div>

                <div>
                  <label
                    htmlFor="businessEmail"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    إيميل النشاط
                  </label>

                  <input
                    id="businessEmail"
                    type="email"
                    value={email}
                    onChange={(event) =>
                      setEmail(event.target.value)
                    }
                    placeholder="business@example.com"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  وصف النشاط
                </label>

                <textarea
                  id="description"
                  rows={5}
                  value={description}
                  onChange={(event) =>
                    setDescription(event.target.value)
                  }
                  placeholder="اكتب نبذة قصيرة عن نشاطك..."
                  className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                />
              </div>
            </div>
          </section>

          {/* Business Hours */}

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-6">
              <h2 className="text-xl font-bold">
                مواعيد العمل
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                حدد الأيام والأوقات التي يمكن للعملاء
                الحجز خلالها.
              </p>
            </div>

            <div className="space-y-4">
              {businessHours.map((hour) => (
                <div
                  key={hour.day_of_week}
                  className={`rounded-2xl border p-4 transition ${
                    hour.is_open
                      ? "border-slate-200 bg-white"
                      : "border-slate-200 bg-slate-50"
                  }`}
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-center gap-4">
                      <label className="relative inline-flex cursor-pointer items-center">
                        <input
                          type="checkbox"
                          checked={hour.is_open}
                          onChange={(event) =>
                            updateBusinessHour(
                              hour.day_of_week,
                              "is_open",
                              event.target.checked
                            )
                          }
                          className="peer sr-only"
                        />

                        <div className="h-6 w-11 rounded-full bg-slate-300 after:absolute after:right-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-all peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white" />
                      </label>

                      <div>
                        <p className="font-bold">
                          {days[hour.day_of_week]}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          {hour.is_open
                            ? "مفتوح"
                            : "مغلق"}
                        </p>
                      </div>
                    </div>

                    {hour.is_open && (
                      <div className="grid grid-cols-2 gap-3 sm:min-w-80">
                        <div>
                          <label className="mb-1 block text-xs font-medium text-slate-400">
                            يفتح
                          </label>

                          <input
                            type="time"
                            value={hour.open_time}
                            onChange={(event) =>
                              updateBusinessHour(
                                hour.day_of_week,
                                "open_time",
                                event.target.value
                              )
                            }
                            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                          />
                        </div>

                        <div>
                          <label className="mb-1 block text-xs font-medium text-slate-400">
                            يغلق
                          </label>

                          <input
                            type="time"
                            value={hour.close_time}
                            onChange={(event) =>
                              updateBusinessHour(
                                hour.day_of_week,
                                "close_time",
                                event.target.value
                              )
                            }
                            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Booking Link & QR Code */}

          {businessId && (
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="mb-6">
                <div className="mb-3 inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-600">
                  مشاركة الحجز
                </div>

                <h2 className="text-xl font-bold">
                  رابط الحجز و QR Code
                </h2>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                  شارك رابط الحجز مع عملائك أو اطبع
                  QR Code وضعه داخل نشاطك ليتمكن
                  العملاء من فتح صفحة الحجز بسرعة.
                </p>
              </div>

              <div className="grid gap-8 lg:grid-cols-[1fr_300px] lg:items-center">
                {/* Link Side */}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    رابط الحجز الخاص بنشاطك
                  </label>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <input
                      type="text"
                      readOnly
                      value={bookingUrl}
                      className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 outline-none"
                    />

                    <button
                      type="button"
                      onClick={copyBookingLink}
                      className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                    >
                      {copied
                        ? "تم النسخ ✓"
                        : "نسخ الرابط"}
                    </button>
                  </div>

                  <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-4">
                    <p className="text-sm font-bold text-blue-900">
                      💡 شارك الرابط مع عملائك
                    </p>

                    <p className="mt-1 text-sm leading-6 text-blue-700">
                      يمكنك إرساله على واتساب أو فيسبوك
                      أو أي وسيلة تواصل، والعميل سيفتح
                      صفحة الحجز مباشرة.
                    </p>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={downloadQRCode}
                      disabled={!qrCodeUrl}
                      className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      تحميل QR Code
                    </button>

                    <button
                      type="button"
                      onClick={printQRCode}
                      disabled={!qrCodeUrl}
                      className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      طباعة QR Code
                    </button>
                  </div>
                </div>

                {/* QR Side */}

                <div className="flex flex-col items-center">
                  <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                    {qrCodeUrl ? (
                      <img
                        src={qrCodeUrl}
                        alt="QR Code للحجز"
                        className="h-56 w-56"
                      />
                    ) : (
                      <div className="flex h-56 w-56 items-center justify-center rounded-2xl bg-slate-50">
                        <div className="text-center">
                          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

                          <p className="mt-3 text-xs text-slate-400">
                            جاري إنشاء QR...
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <p className="mt-4 text-center text-sm font-bold text-slate-700">
                    امسح الكود للحجز
                  </p>

                  <p className="mt-1 text-center text-xs text-slate-400">
                    اطبعه وضعه على المكتب أو في
                    مكان واضح للعملاء
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* Messages */}

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-600">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm leading-6 text-green-700">
              {success}
            </div>
          )}

          {/* Actions */}

          <div className="flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() =>
                router.push("/dashboard")
              }
              className="rounded-xl border border-slate-200 bg-white px-6 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              إلغاء
            </button>

            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-blue-600 px-7 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving
                ? "جاري الحفظ..."
                : "حفظ بيانات النشاط"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}