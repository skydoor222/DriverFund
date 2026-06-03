/**
 * create-payment-link
 *
 * return_items にギフトが INSERT されたとき（または手動コール）に
 * Stripe Payment Link を発行し、return_items.stripe_payment_link_url を更新する。
 *
 * 呼び出し方:
 *   POST /functions/v1/create-payment-link
 *   Body: { return_item_id: string }
 *   Header: Authorization: Bearer <service_role_key>
 */

import Stripe from "https://esm.sh/stripe@14?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2024-04-10",
  httpClient: Stripe.createFetchHttpClient(),
});

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, content-type",
      },
    });
  }

  try {
    const { return_item_id } = await req.json();
    if (!return_item_id) {
      return json({ error: "return_item_id is required" }, 400);
    }

    // return_item を取得
    const { data: item, error: itemErr } = await supabase
      .from("return_items")
      .select("*, drivers(full_name)")
      .eq("id", return_item_id)
      .single();

    if (itemErr || !item) {
      return json({ error: "return_item not found" }, 404);
    }

    // すでにPayment Linkがあればそれを返す
    if (item.stripe_payment_link_url) {
      return json({ url: item.stripe_payment_link_url });
    }

    // Stripe Product 作成
    const product = await stripe.products.create({
      name: item.title,
      description: item.description ?? undefined,
      metadata: {
        return_item_id: item.id,
        driver_id: item.driver_id,
      },
    });

    // Stripe Price 作成
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: item.price * 100, // 円 → 銭（Stripeは最小単位）
      currency: "jpy",
      ...(item.billing_type === "monthly"
        ? { recurring: { interval: "month" } }
        : {}),
    });

    // Payment Link 作成
    const paymentLink = await stripe.paymentLinks.create({
      line_items: [{ price: price.id, quantity: 1 }],
      metadata: {
        return_item_id: item.id,
        driver_id: item.driver_id,
      },
      after_completion: {
        type: "redirect",
        redirect: {
          url: `${Deno.env.get("APP_URL") ?? "https://driverfund-app.vercel.app"}/payment-success?item=${item.id}`,
        },
      },
    });

    // DBに保存
    await supabase
      .from("return_items")
      .update({
        stripe_price_id: price.id,
        stripe_payment_link_url: paymentLink.url,
      })
      .eq("id", item.id);

    return json({ url: paymentLink.url, price_id: price.id });
  } catch (err: any) {
    console.error(err);
    return json({ error: err.message }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
