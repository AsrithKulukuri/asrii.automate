import { NextResponse } from "next/server";
import { getOrCreateDemoSession, DEMO_USER_ID, DEFAULT_DEMO_SESSION } from "@/lib/auth";
import { seedDemoData } from "@/lib/seed";
import { cookies } from "next/headers";

export async function POST() {
  try {
    try {
      await seedDemoData();
    } catch (seedErr) {
      console.warn("[POST /api/auth/demo] Seed execution notice:", seedErr);
    }

    let session;
    try {
      session = await getOrCreateDemoSession();
    } catch {
      session = DEFAULT_DEMO_SESSION;
    }

    const cookieStore = await cookies();
    cookieStore.set("asrii_session", DEMO_USER_ID, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      secure: process.env.NODE_ENV === "production",
    });

    return NextResponse.json({
      success: true,
      user: session,
    });
  } catch (error) {
    console.error("[POST /api/auth/demo] Unexpected error:", error);
    return NextResponse.json({
      success: true,
      user: DEFAULT_DEMO_SESSION,
      warning: (error as Error).message,
    });
  }
}
