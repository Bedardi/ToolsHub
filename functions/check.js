export async function onRequestGet({ request, env }) {
  try {
    const url = new URL(request.url);
    const order_id = url.searchParams.get("order_id");

    if (!order_id) {
      return json({
        status: "error",
        message: "order_id required"
      }, 400);
    }

    const body = new URLSearchParams({
      token_key: env.ZAP_TOKEN,
      secret_key: env.ZAP_SECRET,
      order_id
    });

    const zap = await fetch(
      "https://api.zapupi.com/api/order-status",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body
      }
    );

    const data = await zap.json();

    // 🔹 SUCCESS
    if (data.status === "success" && data.data.status === "Success") {
      return json({
        status: "paid",
        order_id: data.data.order_id,
        amount: data.data.amount,
        utr: data.data.utr,
        txn_id: data.data.txn_id
      });
    }

    // 🔹 PENDING / FAILED
    return json({
      status: "pending",
      order_id,
      gateway_response: data
    });

  } catch (e) {
    return json({
      status: "error",
      message: "Server error"
    }, 500);
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json"
    }
  });
}
