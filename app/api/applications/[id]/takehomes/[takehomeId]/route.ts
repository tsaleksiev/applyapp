import { NextRequest, NextResponse } from "next/server";
import {
  getTakeHomeById,
  updateTakeHome,
  deleteTakeHome,
} from "@/lib/queries/takehomes";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; takehomeId: string }> }
) {
  try {
    const { takehomeId } = await params;
    const th = getTakeHomeById(Number(takehomeId));
    if (!th) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(th);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; takehomeId: string }> }
) {
  try {
    const { takehomeId } = await params;
    const body = await req.json();
    const th = updateTakeHome(Number(takehomeId), body);
    return NextResponse.json(th);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; takehomeId: string }> }
) {
  try {
    const { takehomeId } = await params;
    deleteTakeHome(Number(takehomeId));
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
