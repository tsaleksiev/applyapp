import { NextRequest, NextResponse } from "next/server";
import { globalSearch } from "@/lib/queries/search";

export async function GET(req: NextRequest) {
  try {
    const q = req.nextUrl.searchParams.get("q") ?? "";
    if (q.trim().length < 2) {
      return NextResponse.json([]);
    }
    return NextResponse.json(globalSearch(q.trim()));
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
