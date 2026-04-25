import { NextRequest, NextResponse } from "next/server";
import {
  getDeadlineById,
  updateDeadline,
  deleteDeadline,
} from "@/lib/queries/deadlines";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ deadlineId: string }> }
) {
  try {
    const { deadlineId } = await params;
    const body = await req.json();
    const deadline = updateDeadline(Number(deadlineId), body);
    return NextResponse.json(deadline);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ deadlineId: string }> }
) {
  try {
    const { deadlineId } = await params;
    deleteDeadline(Number(deadlineId));
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
