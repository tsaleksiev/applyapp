import { NextResponse } from "next/server";
import { clearAllData } from "@/lib/db";

// Permanently wipes every table. Irreversible — the client must confirm
// before calling this.
export async function DELETE() {
  try {
    clearAllData();
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
