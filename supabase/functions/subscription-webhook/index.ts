import { createClient } from "npm:@supabase/supabase-js@2.39.6";
import { handleSubscriptionWebhook } from "npm:@lemonsqueezy/lemonsqueezy.js@1.2.5";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// Get environment variables
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const lemonSqueezySigningSecret = Deno.env.get("LEMONSQUEEZY_SIGNING_SECRET");

// Validate required environment variables
if (!supabaseUrl || !supabaseServiceKey || !lemonSqueezySigningSecret) {
  console.error("Missing required environment variables");
  throw new Error("Missing required environment variables");
}

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Helper function to get plan tier from variant ID
function getPlanTier(variantId: string): string {
  const planMap: Record<string, string> = {
    [Deno.env.get("VITE_LEMONSQUEEZY_BASIC_PLAN_ID") || ""]: "basic",
    [Deno.env.get("VITE_LEMONSQUEEZY_PRO_PLAN_ID") || ""]: "pro",
    [Deno.env.get("VITE_LEMONSQUEEZY_ENTERPRISE_PLAN_ID") || ""]: "enterprise",
  };
  return planMap[variantId] || "basic";
}

Deno.serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    // Verify webhook signature
    const signature = req.headers.get("X-Signature");
    if (!signature) {
      throw new Error("Missing webhook signature");
    }

    const body = await req.text();
    const event = JSON.parse(body);

    // Process the webhook event
    const result = await handleSubscriptionWebhook(event);
    if (!result) {
      return new Response(
        JSON.stringify({ error: "Invalid webhook event" }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }

    const { userId, planId, subscriptionId, status } = result;

    // Update subscription in database
    const { error: subscriptionError } = await supabase
      .from("subscriptions")
      .upsert({
        user_id: userId,
        subscription_id: subscriptionId,
        plan_id: getPlanTier(planId),
        status,
      });

    if (subscriptionError) {
      throw new Error(`Failed to update subscription: ${subscriptionError.message}`);
    }

    // Initialize usage tracking if it's a new subscription
    if (status === "active") {
      const { error: usageError } = await supabase
        .from("subscription_usage")
        .upsert({
          user_id: userId,
          citations_used: 0,
          ai_content_used: 0,
          reset_date: new Date().toISOString(),
        });

      if (usageError) {
        throw new Error(`Failed to initialize usage tracking: ${usageError.message}`);
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error) {
    console.error("Error processing webhook:", error);
    
    return new Response(
      JSON.stringify({ 
        error: "Failed to process webhook",
        details: error instanceof Error ? error.message : String(error)
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  }
});