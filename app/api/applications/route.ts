import { NextRequest, NextResponse } from "next/server";
import { getAllApplications, createApplication } from "@/lib/queries/applications";

export async function GET() {
  try {
    return NextResponse.json(getAllApplications());
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.company_id) {
      return NextResponse.json({ error: "company_id is required" }, { status: 400 });
    }
    if (!body.role_title?.trim()) {
      return NextResponse.json({ error: "role_title is required" }, { status: 400 });
    }
    const app = createApplication(body);
    return NextResponse.json(app, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
