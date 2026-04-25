import { NextResponse } from "next/server";
import { getStatusCounts, getStaleApplications, getRecentActivity } from "@/lib/queries/applications";
import { getUpcomingInterviews } from "@/lib/queries/interviews";
import { getUpcomingDeadlines } from "@/lib/queries/deadlines";

export async function GET() {
  try {
    return NextResponse.json({
      statusCounts: getStatusCounts(),
      upcomingInterviews: getUpcomingInterviews(7),
      upcomingDeadlines: getUpcomingDeadlines(7),
      staleApplications: getStaleApplications(),
      recentActivity: getRecentActivity(10),
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
