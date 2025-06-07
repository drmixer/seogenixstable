import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Mail, Lock, CreditCard, Shield, AlertTriangle, ExternalLink } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscription } from '../../contexts/SubscriptionContext';
import AppLayout from '../../components/layout/AppLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import PlanCard from '../../components/subscription/PlanCard';
import { PLAN_IDS } from '../../lib/lemonsqueezy';
import supabase from '../../lib/supabaseClient';
import toast from 'react-hot-toast';

const AccountSettings = () => {
  const { user } = useAuth();
  const { currentPlan, usage } = useSubscription();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nextBillingDate, setNextBillingDate] = useState<string | null>(null);
  
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadSubscriptionDetails = async () => {
      if (!user) return;

      try {
        const { data: subscriptionData } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (subscriptionData) {
          // Calculate next billing date (30 days from subscription creation)
          const createdAt = new Date(subscriptionData.created_at);
          const nextBilling = new Date(createdAt);
          nextBilling.setDate(nextBilling.getDate() + 30);
          setNextBillingDate(nextBilling.toISOString());
        }
      } catch (error) {
        console.error('Error loading subscription details:', error);
      }
    };

    loadSubscriptionDetails();
  }, [user]);
  
  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() || email === user?.email) {
      setError('Please enter a new email address');
      return;
    }
    
    setIsUpdatingEmail(true);
    setError('');
    
    try {
      const { error } = await supabase.auth.updateUser({ email });
      if (error) throw error;
      
      toast.success('Email update initiated. Please check your new email for confirmation.');
    } catch (error) {
      console.error('Error updating email:', error);
      setError(error instanceof Error ? error.message : 'Failed to update email');
      toast.error('Failed to update email');
    } finally {
      setIsUpdatingEmail(false);
    }
  };
  
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password || !confirmPassword) {
      setError('Please fill in all password fields');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    setIsUpdatingPassword(true);
    setError('');
    
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      
      toast.success('Password updated successfully');
      setPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Error updating password:', error);
      setError(error instanceof Error ? error.message : 'Failed to update password');
      toast.error('Failed to update password');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? This action cannot be undone.')) {
      return;
    }
    
    setIsCancelling(true);
    
    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({ status: 'cancelled' })
        .eq('user_id', user?.id);

      if (error) throw error;
      
      toast.success('Subscription cancelled successfully');
      navigate('/dashboard');
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      toast.error('Failed to cancel subscription');
    } finally {
      setIsCancelling(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <AppLayout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
          <p className="mt-2 text-gray-600">
            Manage your account information, security settings, and subscription.
          </p>
        </div>

        <div className="space-y-8 max-w-3xl">
          {/* Profile Information */}
          <Card title="Profile Information">
            <div className="flex items-center mb-6">
              <div className="bg-primary-100 text-primary-800 flex items-center justify-center h-16 w-16 rounded-full">
                <span className="text-xl font-medium">
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {user?.email || 'User'}
                </h3>
                <p className="text-sm text-gray-500">
                  {user?.id ? 'User ID: ' + user.id.substring(0, 8) + '...' : 'Not signed in'}
                </p>
              </div>
            </div>
            
            <form onSubmit={handleUpdateEmail}>
              <div className="space-y-4">
                <div>
                  <Input
                    id="email"
                    label="Email Address"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    icon={<Mail size={16} />}
                  />
                </div>
                
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    variant="primary"
                    isLoading={isUpdatingEmail}
                  >
                    Update Email
                  </Button>
                </div>
              </div>
            </form>
          </Card>
          
          {/* Security */}
          <Card title="Security">
            <form onSubmit={handleUpdatePassword}>
              <div className="space-y-4">
                <div>
                  <Input
                    id="password"
                    label="New Password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    icon={<Lock size={16} />}
                  />
                </div>
                
                <div>
                  <Input
                    id="confirmPassword"
                    label="Confirm New Password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    icon={<Lock size={16} />}
                  />
                </div>
                
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    variant="primary"
                    isLoading={isUpdatingPassword}
                  >
                    Update Password
                  </Button>
                </div>
              </div>
            </form>
          </Card>
          
          {/* Subscription */}
          <Card title="Subscription">
            {currentPlan ? (
              <div className="space-y-6">
                <div className="bg-primary-50 border-l-4 border-primary-400 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <CreditCard className="h-5 w-5 text-primary-400" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-primary-800">
                        Current Plan: {currentPlan.name.charAt(0).toUpperCase() + currentPlan.name.slice(1)}
                      </h3>
                      {nextBillingDate && (
                        <p className="mt-2 text-sm text-primary-700">
                          Next billing date: {formatDate(nextBillingDate)}
                        </p>
                      )}
                      <div className="mt-2 text-sm text-primary-700">
                        <p>Usage this month:</p>
                        <ul className="mt-1 list-disc list-inside">
                          <li>Citations: {usage.citationsUsed}/{currentPlan.limits.citationsPerMonth}</li>
                          <li>AI Content: {usage.aiContentUsed}/{currentPlan.limits.aiContentGenerations}</li>
                          <li>Sites: {currentPlan.limits.sites === Infinity ? 'Unlimited' : currentPlan.limits.sites}</li>
                        </ul>
                      </div>
                      <div className="mt-2">
                        <a
                          href="https://app.lemonsqueezy.com/billing"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-600 hover:text-primary-500 inline-flex items-center text-sm"
                        >
                          Manage Billing
                          <ExternalLink size={14} className="ml-1" />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                  <PlanCard
                    name="Basic"
                    price={29}
                    features={[
                      { name: '1 website', included: true },
                      { name: 'Monthly AI visibility audit', included: true },
                      { name: 'Basic schema generation', included: true },
                      { name: 'Citation alerts', included: true },
                      { name: 'Email support', included: true },
                      { name: 'Voice assistant testing', included: false },
                      { name: 'AI content generator', included: false },
                      { name: 'Priority support', included: false },
                    ]}
                    planId={PLAN_IDS.basic}
                    isCurrentPlan={currentPlan.name === 'basic'}
                  />

                  <PlanCard
                    name="Pro"
                    price={79}
                    features={[
                      { name: '3 websites', included: true },
                      { name: 'Weekly AI visibility audits', included: true },
                      { name: 'Advanced schema generation', included: true },
                      { name: 'Real-time citation tracking', included: true },
                      { name: 'Voice assistant testing', included: true },
                      { name: 'AI content generator', included: true },
                      { name: 'Priority support', included: true },
                      { name: 'API access', included: false },
                    ]}
                    planId={PLAN_IDS.pro}
                    isPopular
                    isCurrentPlan={currentPlan.name === 'pro'}
                  />

                  <PlanCard
                    name="Enterprise"
                    price={199}
                    features={[
                      { name: 'Unlimited websites', included: true },
                      { name: 'Daily AI visibility audits', included: true },
                      { name: 'Custom schema templates', included: true },
                      { name: 'Advanced citation tracking', included: true },
                      { name: 'API access', included: true },
                      { name: 'White-label reports', included: true },
                      { name: 'Priority support', included: true },
                      { name: 'Dedicated success manager', included: true },
                    ]}
                    planId={PLAN_IDS.enterprise}
                    isCurrentPlan={currentPlan.name === 'enterprise'}
                  />
                </div>

                <div className="mt-6 border-t border-gray-200 pt-6">
                  <Button
                    variant="danger"
                    onClick={handleCancelSubscription}
                    isLoading={isCancelling}
                  >
                    Cancel Subscription
                  </Button>
                  <p className="mt-2 text-sm text-gray-500">
                    Your subscription will remain active until the end of your current billing period.
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Subscription</h3>
                <p className="text-gray-500 mb-4">
                  Choose a plan to start optimizing your content for AI visibility.
                </p>
                <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                  <PlanCard
                    name="Basic"
                    price={29}
                    features={[
                      { name: '1 website', included: true },
                      { name: 'Monthly AI visibility audit', included: true },
                      { name: 'Basic schema generation', included: true },
                      { name: 'Citation alerts', included: true },
                      { name: 'Email support', included: true },
                      { name: 'Voice assistant testing', included: false },
                      { name: 'AI content generator', included: false },
                      { name: 'Priority support', included: false },
                    ]}
                    planId={PLAN_IDS.basic}
                  />

                  <PlanCard
                    name="Pro"
                    price={79}
                    features={[
                      { name: '3 websites', included: true },
                      { name: 'Weekly AI visibility audits', included: true },
                      { name: 'Advanced schema generation', included: true },
                      { name: 'Real-time citation tracking', included: true },
                      { name: 'Voice assistant testing', included: true },
                      { name: 'AI content generator', included: true },
                      { name: 'Priority support', included: true },
                      { name: 'API access', included: false },
                    ]}
                    planId={PLAN_IDS.pro}
                    isPopular
                  />

                  <PlanCard
                    name="Enterprise"
                    price={199}
                    features={[
                      { name: 'Unlimited websites', included: true },
                      { name: 'Daily AI visibility audits', included: true },
                      { name: 'Custom schema templates', included: true },
                      { name: 'Advanced citation tracking', included: true },
                      { name: 'API access', included: true },
                      { name: 'White-label reports', included: true },
                      { name: 'Priority support', included: true },
                      { name: 'Dedicated success manager', included: true },
                    ]}
                    planId={PLAN_IDS.enterprise}
                  />
                </div>
              </div>
            )}
          </Card>
          
          {/* Advanced Settings */}
          <Card title="Advanced Settings">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Data Export</h3>
                  <p className="text-sm text-gray-500">
                    Download all your data including audits, schemas, and citations.
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  Export Data
                </Button>
              </div>
              
              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-red-600">Delete Account</h3>
                    <p className="text-sm text-gray-500">
                      Permanently delete your account and all your data.
                    </p>
                  </div>
                  <Button variant="danger" size="sm">
                    Delete Account
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </motion.div>
    </AppLayout>
  );
};

export default AccountSettings;