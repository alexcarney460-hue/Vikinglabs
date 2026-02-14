export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("[/api/chat] body keys:", Object.keys(body ?? {}));

    const messages = body?.messages;
    if (!Array.isArray(messages)) {
      return Response.json(
        { error: "Bad Request: expected { messages: [...] }" },
        { status: 400 }
      );
    }

    console.log("[/api/chat] has OPENAI_API_KEY:", !!process.env.OPENAI_API_KEY);

    return Response.json({ ok: true, received: messages.length }, { status: 200 });

  } catch (err: any) {
    console.error("[/api/chat] error:", err);
    return Response.json(
      {
        error: "Internal Server Error",
        message: String(err?.message || err),
        stack: String(err?.stack || ""),
      },
      { status: 500 }
    );
  }
}
