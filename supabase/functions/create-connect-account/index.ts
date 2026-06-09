/**
 * create-connect-account
 *
 * ドライバーのStripe Express Connectアカウントを作成し、
 * オンボーディングURLを返す。
 *
 * POST /functions/v1/create-connect-account
 * Header: Authorization: Bearer <user_jwt>
 * Body: { driver_id: string, return_url: string }
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
    const { driver_id, return_url } = await req.json();
    if (!driver_id) return json({ error: "driver_id is required" }, 400);

    const appUrl = Deno.env.get("APP_URL") ?? "https://driverfund-app.vercel.app";
    const refreshUrl = return_url ?? `${appUrl}/driver/setup`;
    const successUrl = return_url ?? `${appUrl}/driver/setup?stripe=connected`;

    // ドライバー取得
    const { data: driver, error: driverErr } = await supabase
      .from("drivers")
      .select("id, full_name, stripe_account_id, stripe_onboarding_complete")
      .eq("id", driver_id)
      .single();

    if (driverErr || !driver) return json({ error: "driver not found" }, 404);

    let accountId = driver.stripe_account_id;

    // アカウントがなければ新規作成
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        country: "JP",
        default_currency: "jpy",
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_profile: {
          name: driver.full_name,
          product_description: "レーシングドライバーへの応援支援",
        },
        metadata: { driver_id: driver.id },
      });
      accountId = account.id;

      // DBに保存
      await supabase
        .from("drivers")
        .update({ stripe_account_id: accountId, stripe_onboarding_complete: false })
        .eq("id", driver_id);
    }

    // オンボーディングリンク発行
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: refreshUrl,
      return_url: successUrl,
      type: "account_onboarding",
    });

    return json({ url: accountLink.url, account_id: accountId });
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
