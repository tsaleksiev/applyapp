import { NextRequest, NextResponse } from "next/server";
import {
  getInterviewsByApplication,
  createInterview,
} from "@/lib/queries/interviews";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    return NextResponse.json(getInterviewsByApplication(Number(id)));
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    if (!body.round_name?.trim()) {
      return NextResponse.json({ error: "round_name is required" }, { status: 400 });
    }
    const interview = createInterview({ ...body, application_id: Number(id) });
    return NextResponse.json(interview, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
