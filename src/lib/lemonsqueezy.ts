import LemonSqueezy from '@lemonsqueezy/lemonsqueezy.js';

// Initialize LemonSqueezy with your API key
export const lemonSqueezy = new LemonSqueezy(import.meta.env.VITE_LEMONSQUEEZY_API_KEY);

// Plan IDs from your LemonSqueezy dashboard
export const PLAN_IDS = {
  basic: import.meta.env.VITE_LEMONSQUEEZY_BASIC_PLAN_ID,
  pro: import.meta.env.VITE_LEMONSQUEEZY_PRO_PLAN_ID,
  enterprise: import.meta.env.VITE_LEMONSQUEEZY_ENTERPRISE_PLAN_ID
};

// Helper function to create a checkout URL
export const createCheckout = async (planId: string, email?: string) => {
  try {
    const checkout = await lemonSqueezy.createCheckout({
      storeId: import.meta.env.VITE_LEMONSQUEEZY_STORE_ID,
      variantId: planId,
      checkoutData: {
        email,
        custom: {
          user_id: email // We'll use this to link the subscription to the user
        }
      }
    });
    
    return checkout.url;
  } catch (error) {
    console.error('Error creating checkout:', error);
    throw error;
  }
};

// Helper function to handle subscription webhooks
export const handleSubscriptionWebhook = async (event: any) => {
  const { data } = event;
  
  switch (event.type) {
    case 'subscription_created':
      // Handle new subscription
      return {
        userId: data.custom_data.user_id,
        planId: data.variant_id,
        subscriptionId: data.id,
        status: 'active'
      };
    
    case 'subscription_updated':
      // Handle subscription update
      return {
        userId: data.custom_data.user_id,
        planId: data.variant_id,
        subscriptionId: data.id,
        status: data.status
      };
    
    case 'subscription_cancelled':
      // Handle subscription cancellation
      return {
        userId: data.custom_data.user_id,
        subscriptionId: data.id,
        status: 'cancelled'
      };
    
    default:
      return null;
  }
};