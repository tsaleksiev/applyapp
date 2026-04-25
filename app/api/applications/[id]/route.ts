import { NextRequest, NextResponse } from "next/server";
import {
  getApplicationById,
  updateApplication,
  deleteApplication,
  getStatusHistory,
} from "@/lib/queries/applications";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const app = getApplicationById(Number(id));
    if (!app) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const history = getStatusHistory(Number(id));
    return NextResponse.json({ ...app, status_history: history });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const app = updateApplication(Number(id), body);
    return NextResponse.json(app);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    deleteApplication(Number(id));
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
