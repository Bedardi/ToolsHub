export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // =========================
    // CREATE PAYMENT (GET)
    // =========================
    if (path === "/api/create") {
      const amount = parseInt(url.searchParams.get("amount"), 10);

      if (!amount || amount < 1) {
        return json(
          { status: "error", message: "Invalid amount" },
          400
        );
      }

      const order_id = generateOrderId();

      const body = new URLSearchParams({
        token_key: env.ZAP_TOKEN,
        secret_key: env.ZAP_SECRET,
        amount: amount.toString(),
        order_id: order_id,
        redirect_url: "https://mistafy.pages.dev/success.html"
      });

      let zapRes, zapData;
      try {
        zapRes = await fetch(
          "https://api.zapupi.com/api/create-order",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded"
            },
            body
          }
        );
        zapData = await zapRes.json();
      } catch (e) {
        return json(
          { status: "error", message: "Gateway request failed" },
          502
        );
      }

      if (zapData.status !== "success") {
        return json(
          {
            status: "error",
            sent_order_id: order_id,
            gateway_response: zapData
          },
          400
        );
      }

      return json({
        status: "success",
        order_id: order_id,
        amount: amount,
        payment_url: zapData.payment_url
      });
    }

    // =========================
    // CHECK PAYMENT STATUS (GET)
    // =========================
    if (path === "/api/check") {
      const order_id = url.searchParams.get("order_id");

      if (!order_id) {
        return json(
          { status: "error", message: "order_id required" },
          400
        );
      }

      const body = new URLSearchParams({
        token_key: env.ZAP_TOKEN,
        secret_key: env.ZAP_SECRET,
        order_id
      });

      let zapRes, zapData;
      try {
        zapRes = await fetch(
          "https://api.zapupi.com/api/order-status",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded"
            },
            body
          }
        );
        zapData = await zapRes.json();
      } catch (e) {
        return json(
          { status: "error", message: "Gateway request failed" },
          502
        );
      }

      // ✅ PAID
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
        order_id: order_id,
        gateway_response: zapData
      });
    }

    // =========================
    // DEFAULT
    // =========================
    return new Response("Not Found", { status: 404 });
  }
};

// =========================
// HELPERS
// =========================
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

// ZapUPI-safe Order ID (A–Z, 0–9, 8–10 length)
function generateOrderId() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let id = "ZPU";
  for (let i = 0; i < 7; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}
