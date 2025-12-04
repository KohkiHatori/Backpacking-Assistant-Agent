import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";

export async function POST(req: NextRequest) {
  try {
    const { tripId, taskTitle } = await req.json();

    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const userId = (session.user as any).id; // set in your session callback

    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

    const response = await fetch(`${apiBaseUrl}/api/accommodations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // You can send userId to FastAPI so it can look up the user
        "x-user-id": userId,
      },
      body: JSON.stringify({ tripId, taskTitle }),
    });
    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error("Accommodation proxy error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
