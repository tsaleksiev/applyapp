import { NextResponse } from "next/server";
import { getAllInterviewsForCalendar } from "@/lib/queries/interviews";
import { getAllDeadlinesForCalendar } from "@/lib/queries/deadlines";

export async function GET() {
  try {
    return NextResponse.json({
      interviews: getAllInterviewsForCalendar(),
      deadlines: getAllDeadlinesForCalendar(),
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
