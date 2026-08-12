import { NextResponse } from "next/server";

const VERIFY_TOKEN =
  process.env.WHATSAPP_VERIFY_TOKEN ||
  "bookingos_webhook_2026";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const mode =
    searchParams.get("hub.mode");

  const token =
    searchParams.get("hub.verify_token");

  const challenge =
    searchParams.get("hub.challenge");

  if (
    mode === "subscribe" &&
    token === VERIFY_TOKEN &&
    challenge
  ) {
    return new Response(challenge, {
      status: 200,
      headers: {
        "Content-Type": "text/plain",
      },
    });
  }

  return NextResponse.json(
    {
      error: "Verification failed",
    },
    { status: 403 }
  );
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    console.log(
      "=============================="
    );

    console.log(
      "WHATSAPP WEBHOOK:"
    );

    console.log(
      JSON.stringify(
        body,
        null,
        2
      )
    );

    console.log(
      "=============================="
    );

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(
      "WEBHOOK ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
      },
      { status: 400 }
    );
  }
}