import { NextResponse } from "next/server";
import { listTechnologies, getTopTechnologies } from "@/lib/queries/technologies";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    if (url.searchParams.get("top") === "1") {
      const limit = Number(url.searchParams.get("limit") ?? 10);
      return NextResponse.json(getTopTechnologies(limit));
    }
    return NextResponse.json(listTechnologies());
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
