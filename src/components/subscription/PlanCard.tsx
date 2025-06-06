import React, { useState } from 'react';
import { Check } from 'lucide-react';
import Button from '../ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { createCheckout } from '../../lib/lemonsqueezy';
import toast from 'react-hot-toast';

interface PlanFeature {
  name: string;
  included: boolean;
}

interface PlanCardProps {
  name: string;
  price: number;
  features: PlanFeature[];
  planId: string;
  isPopular?: boolean;
  isCurrentPlan?: boolean;
}

const PlanCard: React.FC<PlanCardProps> = ({
  name,
  price,
  features,
  planId,
  isPopular = false,
  isCurrentPlan = false
}) => {
  const { user } = useAuth();
  const { loading: subscriptionLoading } = useSubscription();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubscribe = async () => {
    if (!user) {
      toast.error('Please log in to subscribe');
      return;
    }

    setIsLoading(true);
    try {
      const checkoutUrl = await createCheckout(planId, user.email);
      window.location.href = checkoutUrl;
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast.error('Failed to start checkout process');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`relative card p-8 ${isPopular ? 'border-2 border-primary-600' : ''}`}>
      {isPopular && (
        <div className="absolute top-0 right-0 -translate-y-1/2 px-4 py-1 bg-primary-600 text-white rounded-full text-sm font-medium">
          Most Popular
        </div>
      )}
      
      <h3 className="text-lg font-medium text-gray-900">{name}</h3>
      <p className="mt-4 text-sm text-gray-500">Perfect for {name === 'Basic' ? 'small websites and blogs' : name === 'Pro' ? 'growing businesses' : 'large organizations'}</p>
      
      <p className="mt-8">
        <span className="text-4xl font-extrabold text-gray-900">${price}</span>
        <span className="text-base font-medium text-gray-500">/month</span>
      </p>
      
      <ul className="mt-8 space-y-4">
        {features.map((feature, index) => (
          <li key={index} className="flex items-center">
            <Check className={`h-5 w-5 ${feature.included ? 'text-primary-600' : 'text-gray-300'} mr-2`} />
            <span className={feature.included ? 'text-gray-500' : 'text-gray-300'}>
              {feature.name}
            </span>
          </li>
        ))}
      </ul>
      
      <div className="mt-8">
        <Button
          variant={isCurrentPlan ? 'secondary' : 'primary'}
          className="w-full"
          onClick={handleSubscribe}
          disabled={isCurrentPlan || isLoading || subscriptionLoading}
        >
          {isCurrentPlan ? 'Current Plan' : 'Subscribe'}
        </Button>
      </div>
    </div>
  );
};

export default PlanCard;