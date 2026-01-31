export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // ✅ CREATE ORDER
    if (url.pathname === "/api/create") {
      const amount = url.searchParams.get("amount");

      return new Response(JSON.stringify({
        status: "ok",
        api: "create",
        amount: amount
      }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    // ❌ Not API → serve site
    return new Response("Not Found", { status: 404 });
  }
};
