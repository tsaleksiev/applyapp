import { NextRequest, NextResponse } from "next/server";
import { getAllCompanies, createCompany } from "@/lib/queries/companies";

export async function GET() {
  try {
    return NextResponse.json(getAllCompanies());
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.name?.trim()) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }
    const company = createCompany(body);
    return NextResponse.json(company, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
