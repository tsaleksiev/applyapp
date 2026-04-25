import { NextRequest, NextResponse } from "next/server";
import {
  getDeadlinesByApplication,
  createDeadline,
} from "@/lib/queries/deadlines";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    return NextResponse.json(getDeadlinesByApplication(Number(id)));
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
    if (!body.title?.trim() || !body.due_at) {
      return NextResponse.json({ error: "title and due_at are required" }, { status: 400 });
    }
    const deadline = createDeadline({ ...body, application_id: Number(id) });
    return NextResponse.json(deadline, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
