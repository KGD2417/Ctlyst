import { NextResponse } from "next/server";
import { appendFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { validate, type Payload } from "@/lib/join-schema";

/**
 * The front door.
 *
 * Re-validates server-side — the client's checks are for the reader's benefit,
 * not ours. Appends to a JSONL file so submissions survive without a database.
 *
 * SEAM: to deliver these to a real inbox, send from here (Resend, Postmark, SES,
 * whatever the client prefers) after the append succeeds. Deliberately left
 * unwired — it needs a provider and credentials that are not mine to choose.
 */

const STORE = join(process.cwd(), ".data");
const FILE = join(STORE, "enquiries.jsonl");

export async function POST(request: Request) {
  let data: Payload;
  try {
    data = (await request.json()) as Payload;
  } catch {
    return NextResponse.json({ ok: false, message: "That request was not readable." }, { status: 400 });
  }

  // Honeypot: humans never see this field, so anything in it is a bot. Answer
  // with a success shape so the bot has nothing to learn from the difference.
  if ((data.website ?? "").trim() !== "") {
    return NextResponse.json({ ok: true });
  }

  const errors = validate(data);
  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ ok: false, errors }, { status: 422 });
  }

  try {
    await mkdir(STORE, { recursive: true });
    await appendFile(
      FILE,
      JSON.stringify({
        name: (data.name ?? "").trim(),
        email: (data.email ?? "").trim(),
        role: data.role,
        message: (data.message ?? "").trim(),
        at: new Date().toISOString(),
      }) + "\n",
      "utf8",
    );
  } catch {
    return NextResponse.json(
      { ok: false, message: "We could not record that just now. Try again in a moment." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
