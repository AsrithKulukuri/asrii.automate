import { NextResponse } from "next/server";
import { getOrCreateDemoSession, DEMO_USER_ID } from "@/lib/auth";
import { seedDemoData } from "@/lib/seed";
import { cookies } from "next/headers";

export async function POST() {
  try {
    await seedDemoData();
    const session = await getOrCreateDemoSession();

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
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
