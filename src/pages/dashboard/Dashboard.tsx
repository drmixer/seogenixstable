import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { siteApi } from '../../lib/api';
import { motion } from 'framer-motion';
import { Plus, ExternalLink, Calendar, Trash2, Lock, BarChart3, TrendingUp, Globe } from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import toast from 'react-hot-toast';

interface Site {
  id: string;
  name: string;
  url: string;
  created_at: string;
}

const Dashboard = () => {
  const { user } = useAuth();
  const { currentPlan, getSiteLimit, getAuditFrequency, usage } = useSubscription();
  const [sites, setSites] = useState<Site[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  useEffect(() => {
    const loadSites = async () => {
      if (!user) return;
      
      try {
        const sitesData = await siteApi.getSites(user.id);
        setSites(sitesData);
      } catch (error) {
        console.error('Error loading sites:', error);
        toast.error('Failed to load your sites');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadSites();
  }, [user]);

  const handleDeleteSite = async (siteId: string) => {
    if (!confirm('Are you sure you want to delete this site? This action cannot be undone.')) {
      return;
    }
    
    setIsDeleting(siteId);
    
    try {
      await siteApi.deleteSite(siteId);
      setSites(sites.filter(site => site.id !== siteId));
      toast.success('Site deleted successfully');
    } catch (error) {
      console.error('Error deleting site:', error);
      toast.error('Failed to delete site');
    } finally {
      setIsDeleting(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const siteLimit = getSiteLimit();
  const canAddMoreSites = sites.length < siteLimit;

  return (
    <AppLayout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Welcome back!</h1>
          <p className="text-gray-600 mt-1">
            Here's an overview of your AI visibility optimization platform.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-indigo-50 border border-indigo-100">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Globe className="h-8 w-8 text-indigo-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-indigo-800">Total Sites</h3>
                <div className="text-2xl font-bold text-indigo-600">{sites.length}</div>
                <div className="text-xs text-indigo-600">of {siteLimit} allowed</div>
              </div>
            </div>
          </Card>

          <Card className="bg-green-50 border border-green-100">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BarChart3 className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-green-800">Current Plan</h3>
                <div className="text-lg font-bold text-green-600 capitalize">
                  {currentPlan?.name || 'Basic'}
                </div>
                <div className="text-xs text-green-600">{getAuditFrequency()} audits</div>
              </div>
            </div>
          </Card>

          <Card className="bg-blue-50 border border-blue-100">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-blue-800">Citations Used</h3>
                <div className="text-2xl font-bold text-blue-600">{usage.citationsUsed}</div>
                <div className="text-xs text-blue-600">this month</div>
              </div>
            </div>
          </Card>

          <Card className="bg-purple-50 border border-purple-100">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BarChart3 className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-purple-800">AI Content Used</h3>
                <div className="text-2xl font-bold text-purple-600">{usage.aiContentUsed}</div>
                <div className="text-xs text-purple-600">this month</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Site Limit Warning */}
        {!canAddMoreSites && (
          <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <Lock className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  You've reached your site limit. 
                  <Link to="/account-settings" className="font-medium text-yellow-700 underline ml-1">
                    Upgrade your plan
                  </Link> to add more sites.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <Link to="/ai-visibility-audit" className="block">
              <div className="flex items-center p-2">
                <div className="flex-shrink-0">
                  <BarChart3 className="h-8 w-8 text-indigo-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Run AI Audits</h3>
                  <p className="text-sm text-gray-500">Analyze all your sites for AI visibility</p>
                </div>
              </div>
            </Link>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <Link to="/citation-tracker" className="block">
              <div className="flex items-center p-2">
                <div className="flex-shrink-0">
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Track Citations</h3>
                  <p className="text-sm text-gray-500">Monitor AI system citations</p>
                </div>
              </div>
            </Link>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <Link to="/add-site" className="block">
              <div className="flex items-center p-2">
                <div className="flex-shrink-0">
                  <Plus className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Add New Site</h3>
                  <p className="text-sm text-gray-500">Start optimizing another website</p>
                </div>
              </div>
            </Link>
          </Card>
        </div>

        {/* Sites Overview */}
        <Card>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Your Sites</h2>
            {canAddMoreSites && (
              <Link to="/add-site">
                <Button 
                  variant="primary" 
                  size="sm" 
                  icon={<Plus size={16} />}
                >
                  Add Site
                </Button>
              </Link>
            )}
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : sites.length === 0 ? (
            <EmptyState
              title="No sites added yet"
              description="Add your first site to start analyzing and optimizing for AI visibility."
              icon={<Globe size={24} />}
              actionLabel="Add Your First Site"
              onAction={() => window.location.href = '/add-site'}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Site
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      URL
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Added
                    </th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sites.map((site) => (
                    <tr key={site.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{site.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <a 
                          href={site.url.startsWith('http') ? site.url : `https://${site.url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-indigo-600 hover:text-indigo-900 flex items-center"
                        >
                          {site.url}
                          <ExternalLink size={14} className="ml-1" />
                        </a>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <Calendar size={14} className="mr-1" />
                          {formatDate(site.created_at)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <Link to={`/sites/${site.id}`}>
                            <Button variant="outline" size="sm">
                              Manage
                            </Button>
                          </Link>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDeleteSite(site.id)}
                            isLoading={isDeleting === site.id}
                            icon={<Trash2 size={14} />}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </motion.div>
    </AppLayout>
  );
};

export default Dashboard;