export async function onRequestGet({ request }) {
  const url = new URL(request.url);
  const amount = url.searchParams.get("amount");

  return new Response(JSON.stringify({
    status: "ok",
    amount: amount
  }), {
    headers: {
      "Content-Type": "application/json"
    }
  });
}
