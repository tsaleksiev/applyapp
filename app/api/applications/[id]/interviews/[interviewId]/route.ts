import { NextRequest, NextResponse } from "next/server";
import {
  getInterviewById,
  updateInterview,
  deleteInterview,
} from "@/lib/queries/interviews";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; interviewId: string }> }
) {
  try {
    const { interviewId } = await params;
    const interview = getInterviewById(Number(interviewId));
    if (!interview) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(interview);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; interviewId: string }> }
) {
  try {
    const { interviewId } = await params;
    const body = await req.json();
    const interview = updateInterview(Number(interviewId), body);
    return NextResponse.json(interview);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; interviewId: string }> }
) {
  try {
    const { interviewId } = await params;
    deleteInterview(Number(interviewId));
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
