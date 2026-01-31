export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // =========================
    // CREATE PAYMENT
    // =========================
    if (path === "/api/create") {
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

      const zapRes = await fetch(
        "https://api.zapupi.com/api/create-order",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded"
          },
          body
        }
      );

      const zapData = await zapRes.json();

      if (zapData.status !== "success") {
        return json({
          status: "error",
          gateway_response: zapData
        }, 400);
      }

      return json({
        status: "success",
        order_id,
        amount,
        payment_url: zapData.payment_url
      });
    }

    // =========================
    // CHECK PAYMENT STATUS
    // =========================
    if (path === "/api/check") {
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

      const zapRes = await fetch(
        "https://api.zapupi.com/api/order-status",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded"
          },
          body
        }
      );

      const zapData = await zapRes.json();

      // ✅ PAYMENT SUCCESS
      if (
        zapData.status === "success" &&
        zapData.data &&
        zapData.data.status === "Success"
      ) {
        return json({
          status: "paid",
          order_id: zapData.data.order_id,
          amount: zapData.data.amount,
          utr: zapData.data.utr,
          txn_id: zapData.data.txn_id,
          remark: zapData.data.remark
        });
      }

      // ⏳ PENDING / FAILED
      return json({
        status: "pending",
        order_id,
        gateway_response: zapData
      });
    }

    // =========================
    // DEFAULT
    // =========================
    return new Response("Not Found", { status: 404 });
  }
};

// JSON helper
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json"
    }
  });
}
