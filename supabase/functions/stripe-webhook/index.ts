/**
 * stripe-webhook
 *
 * Stripe からの Webhook を受け取り、決済完了時に sponsorships を更新する。
 *
 * Stripe ダッシュボードで以下のイベントを登録:
 *   - checkout.session.completed
 *   - invoice.payment_succeeded  (月額サブスク)
 *   - payment_intent.succeeded   (単発)
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

const WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;

Deno.serve(async (req) => {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, sig, WEBHOOK_SECRET);
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  try {
    switch (event.type) {

      // ── 単発ギフト決済完了 ──
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const meta = session.metadata ?? {};
        const returnItemId = meta.return_item_id;
        const supporterEmail = session.customer_details?.email;

        if (!returnItemId) break;

        // メールからprofile取得
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("email", supporterEmail)
          .single();

        // return_item取得
        const { data: item } = await supabase
          .from("return_items")
          .select("driver_id, price, billing_type")
          .eq("id", returnItemId)
          .single();

        if (!item) break;

        // sponsorship 作成
        await supabase.from("sponsorships").insert({
          supporter_id: profile?.id ?? null,
          driver_id: item.driver_id,
          return_item_id: returnItemId,
          amount: item.price,
          status: "active",
          stripe_payment_intent_id: session.payment_intent as string ?? null,
          stripe_subscription_id: session.subscription as string ?? null,
        });

        // remaining を減らす
        await supabase.rpc("decrement_remaining", { item_id: returnItemId });
        break;
      }

      // ── 月額サブスク 更新決済 ──
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const subId = invoice.subscription as string;
        if (!subId) break;

        await supabase
          .from("sponsorships")
          .update({
            status: "active",
            next_billing_at: new Date(
              (invoice.lines.data[0]?.period?.end ?? 0) * 1000
            ).toISOString(),
          })
          .eq("stripe_subscription_id", subId);
        break;
      }

      // ── サブスク キャンセル ──
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await supabase
          .from("sponsorships")
          .update({ status: "completed" })
          .eq("stripe_subscription_id", sub.id);
        break;
      }
    }

    return new Response("ok", { status: 200 });
  } catch (err: any) {
    console.error("Webhook handler error:", err);
    return new Response("Internal error", { status: 500 });
  }
});
