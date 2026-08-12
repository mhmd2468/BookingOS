"use client";

import { useState } from "react";

export default function WhatsAppTestPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [result, setResult] = useState("");

  async function sendTestMessage() {
    setLoading(true);
    setResult("");

    try {
      const response = await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: message,
          message:
            "🚀 تم الاتصال بـ WhatsApp بنجاح من BookingOS",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error(data);

        setResult(
          data?.error ||
            "حدث خطأ أثناء إرسال الرسالة."
        );

        return;
      }

      setResult(
        "✅ تم إرسال الرسالة بنجاح! راجع WhatsApp."
      );
    } catch (error) {
      console.error(error);

      setResult(
        "❌ حدث خطأ في الاتصال بالسيرفر."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      dir="rtl"
      className="flex min-h-screen items-center justify-center bg-slate-950 px-6"
    >
      <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-8 text-white shadow-2xl">
        <div className="text-center">
          <div className="text-5xl">📱</div>

          <h1 className="mt-5 text-2xl font-bold">
            اختبار WhatsApp
          </h1>

          <p className="mt-3 text-sm leading-7 text-slate-400">
            أرسل رسالة تجريبية من BookingOS
            إلى رقم الاختبار الخاص بك.
          </p>
        </div>

        <div className="mt-8">
          <label className="mb-2 block text-sm font-semibold">
            رقم Test Recipient
          </label>

          <input
            type="tel"
            value={message}
            onChange={(event) =>
              setMessage(event.target.value)
            }
            placeholder="2010xxxxxxxx"
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-left text-white outline-none focus:border-blue-500"
          />
        </div>

        <button
          type="button"
          onClick={sendTestMessage}
          disabled={loading || !message.trim()}
          className="mt-5 w-full rounded-xl bg-blue-600 px-5 py-3.5 font-bold transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading
            ? "جاري الإرسال..."
            : "📤 إرسال رسالة اختبار"}
        </button>

        {result && (
          <div className="mt-5 rounded-xl bg-slate-950 p-4 text-center text-sm leading-6">
            {result}
          </div>
        )}
      </div>
    </main>
  );
}