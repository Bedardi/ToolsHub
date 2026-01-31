export async function onRequestGet({ request, env }) {
  try {
    const url = new URL(request.url);
    const amount = parseInt(url.searchParams.get("amount"));

    if (!amount || amount < 1) {
      return json({
        status: "error",
        message: "Invalid amount"
      }, 400);
    }

    const order_id = "ORD_" + Date.now();

    const body = new URLSearchParams({
      token_key: env.ZAP_TOKEN,
      secret_key: env.ZAP_SECRET,
      amount: amount.toString(),
      order_id,
      redirect_url: "https://mistafy.pages.dev/success.html"
    });

    const zap = await fetch(
      "https://api.zapupi.com/api/create-order",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body
      }
    );

    const data = await zap.json();

    return json({
      status: "success",
      order_id,
      amount,
      payment_url: data.payment_url,
      gateway: "zapupi"
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
