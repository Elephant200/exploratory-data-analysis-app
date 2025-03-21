import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const chatHistory = await req.json();

  const response = await fetch("http://localhost:8000/chat/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(chatHistory),
  });

  return new NextResponse(response.body, {
    headers: { "Content-Type": "application/x-ndjson" },
  });
}
