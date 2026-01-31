export async function onRequestGet(context) {
  try {
    const { request, env } = context;
    const url = new URL(request.url);
    const amount = url.searchParams.get("amount");

    if (!amount) {
      return new Response(JSON.stringify({
        status: "error",
        message: "amount missing"
      }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify({
      status: "ok",
      amount: amount
    }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (e) {
    return new Response(JSON.stringify({
      status: "error",
      message: e.toString()
    }), {
      headers: { "Content-Type": "application/json" }
    });
  }
}
