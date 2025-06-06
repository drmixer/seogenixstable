import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BarChart3, ArrowRight } from 'lucide-react';
import { useSubscription } from '../../contexts/SubscriptionContext';
import AppLayout from '../../components/layout/AppLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import toast from 'react-hot-toast';

const AiVisibilityAudit = () => {
  const { canRunAudit, getAuditFrequency } = useSubscription();

  const handleRunAudit = () => {
    if (!canRunAudit()) {
      toast.error(`You can only run audits ${getAuditFrequency()}. Please wait for your next available audit.`);
      return;
    }
    // Rest of audit logic...
  };

  return (
    <AppLayout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">AI Visibility Audit</h1>
          <p className="mt-2 text-gray-600">
            Analyze how well your content performs with AI systems and get actionable recommendations.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
          <div className="p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="mb-4 md:mb-0">
                <h2 className="text-lg font-medium text-gray-900">Run an AI Visibility Audit</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Get a comprehensive analysis of your website's AI visibility factors.
                </p>
              </div>
              <Link to="/add-site">
                <Button variant="primary" size="md">
                  Add a Site to Audit
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <h2 className="text-xl font-semibold text-gray-900 mb-4">What We Analyze</h2>
        
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-8">
          <Card className="h-full">
            <h3 className="text-lg font-medium text-gray-900 mb-2">AI Visibility Score</h3>
            <p className="text-gray-600 mb-4">
              Overall assessment of how visible and understandable your content is to AI systems.
            </p>
            <div className="mt-auto pt-4">
              <div className="h-2 bg-gray-200 rounded-full">
                <div className="h-2 bg-indigo-600 rounded-full" style={{ width: '75%' }}></div>
              </div>
            </div>
          </Card>
          
          <Card className="h-full">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Schema Markup</h3>
            <p className="text-gray-600 mb-4">
              Evaluates your structured data implementation and suggests improvements.
            </p>
            <div className="mt-auto pt-4">
              <div className="h-2 bg-gray-200 rounded-full">
                <div className="h-2 bg-green-500 rounded-full" style={{ width: '60%' }}></div>
              </div>
            </div>
          </Card>
          
          <Card className="h-full">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Semantic Relevance</h3>
            <p className="text-gray-600 mb-4">
              Measures how well your content matches common queries in your industry.
            </p>
            <div className="mt-auto pt-4">
              <div className="h-2 bg-gray-200 rounded-full">
                <div className="h-2 bg-blue-500 rounded-full" style={{ width: '85%' }}></div>
              </div>
            </div>
          </Card>
          
          <Card className="h-full">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Citation Score</h3>
            <p className="text-gray-600 mb-4">
              Tracks how often AI systems reference your content in responses.
            </p>
            <div className="mt-auto pt-4">
              <div className="h-2 bg-gray-200 rounded-full">
                <div className="h-2 bg-purple-500 rounded-full" style={{ width: '40%' }}></div>
              </div>
            </div>
          </Card>
          
          <Card className="h-full">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Technical SEO</h3>
            <p className="text-gray-600 mb-4">
              Analyzes technical factors that affect AI crawling and understanding.
            </p>
            <div className="mt-auto pt-4">
              <div className="h-2 bg-gray-200 rounded-full">
                <div className="h-2 bg-yellow-500 rounded-full" style={{ width: '70%' }}></div>
              </div>
            </div>
          </Card>
          
          <Card className="h-full">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Entity Coverage</h3>
            <p className="text-gray-600 mb-4">
              Identifies key entities in your content and gaps in coverage.
            </p>
            <div className="mt-auto pt-4">
              <div className="h-2 bg-gray-200 rounded-full">
                <div className="h-2 bg-orange-500 rounded-full" style={{ width: '55%' }}></div>
              </div>
            </div>
          </Card>
        </div>

        <Card className="bg-indigo-50 border border-indigo-100">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="flex items-start mb-4 md:mb-0">
              <div className="flex-shrink-0">
                <BarChart3 className="h-6 w-6 text-indigo-600" />
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-indigo-900">View Your Audit Results</h3>
                <p className="mt-1 text-sm text-indigo-700">
                  Check the detailed results of your site's AI visibility audit.
                </p>
              </div>
            </div>
            <Link to="/dashboard">
              <Button 
                variant="primary"
                icon={<ArrowRight size={16} />}
              >
                Go to Dashboard
              </Button>
            </Link>
          </div>
        </Card>
      </motion.div>
    </AppLayout>
  );
};

export default AiVisibilityAudit;