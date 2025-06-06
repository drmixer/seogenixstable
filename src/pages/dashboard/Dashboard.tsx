import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { siteApi } from '../../lib/api';
import { motion } from 'framer-motion';
import { Plus, BarChart3, ExternalLink, Calendar, Trash2, Lock } from 'lucide-react';
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
  const { currentPlan, getSiteLimit, getAuditFrequency } = useSubscription();
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
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">
              {currentPlan && (
                <>
                  <span className="font-medium">{currentPlan.name.charAt(0).toUpperCase() + currentPlan.name.slice(1)} Plan</span>
                  <span className="mx-2">•</span>
                  <span>{sites.length}/{siteLimit} sites used</span>
                  <span className="mx-2">•</span>
                  <span>{getAuditFrequency()} audits</span>
                </>
              )}
            </p>
          </div>
          <Link to="/add-site">
            <Button 
              variant="primary" 
              size="md" 
              icon={<Plus size={16} />}
              disabled={!canAddMoreSites}
            >
              Add Site
            </Button>
          </Link>
        </div>

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

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : sites.length === 0 ? (
          <EmptyState
            title="No sites added yet"
            description="Add your first site to start analyzing and optimizing for AI visibility."
            icon={<BarChart3 size={24} />}
            actionLabel="Add Your First Site"
            onAction={() => window.location.href = '/add-site'}
          />
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {sites.map((site) => (
              <motion.div
                key={site.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="h-full">
                  <div className="flex flex-col h-full">
                    <div className="flex-grow">
                      <h3 className="text-lg font-medium text-gray-900 mb-2 truncate">{site.name}</h3>
                      <div className="flex items-center text-sm text-gray-500 mb-4">
                        <ExternalLink size={14} className="mr-1" />
                        <a 
                          href={site.url.startsWith('http') ? site.url : `https://${site.url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="truncate hover:text-primary-600 transition-colors"
                        >
                          {site.url}
                        </a>
                      </div>
                      <div className="flex items-center text-sm text-gray-500 mb-4">
                        <Calendar size={14} className="mr-1" />
                        <span>Added on {formatDate(site.created_at)}</span>
                      </div>
                    </div>
                    <div className="flex mt-4 space-x-2">
                      <Link 
                        to={`/sites/${site.id}`}
                        className="flex-1"
                      >
                        <Button variant="primary" className="w-full">
                          View Details
                        </Button>
                      </Link>
                      <Button 
                        variant="outline" 
                        onClick={() => handleDeleteSite(site.id)}
                        isLoading={isDeleting === site.id}
                        icon={<Trash2 size={16} />}
                      />
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </AppLayout>
  );
};

export default Dashboard;