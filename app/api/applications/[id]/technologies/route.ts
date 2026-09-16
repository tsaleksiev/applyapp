import { NextRequest, NextResponse } from "next/server";
import {
  getApplicationTechnologies,
  setApplicationTechnologies,
} from "@/lib/queries/technologies";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    return NextResponse.json(getApplicationTechnologies(Number(id)));
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const names: string[] = Array.isArray(body.technologies) ? body.technologies : [];
    const updated = setApplicationTechnologies(Number(id), names);
    return NextResponse.json(updated);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
