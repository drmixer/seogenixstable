import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { siteApi } from '../../lib/api';
import { motion } from 'framer-motion';
import { Globe, AlertCircle } from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import toast from 'react-hot-toast';

// Helper function to validate URL
const isValidUrl = (urlString: string): boolean => {
  try {
    const url = new URL(urlString.startsWith('http') ? urlString : `https://${urlString}`);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

const AddSite = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !url) {
      setError('Please fill in all fields');
      return;
    }
    
    // URL validation
    let formattedUrl = url;
    if (!url.match(/^https?:\/\//i)) {
      formattedUrl = 'https://' + url;
    }
    
    if (!isValidUrl(formattedUrl)) {
      setError('Please enter a valid website URL');
      return;
    }
    
    // Check for localhost and private network URLs
    const urlObj = new URL(formattedUrl);
    const hostname = urlObj.hostname.toLowerCase();
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.') ||
      hostname.startsWith('172.16.')
    ) {
      setError('Please enter a public website URL. Local URLs (localhost) and private network addresses cannot be analyzed.');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      const site = await siteApi.addSite(user.id, formattedUrl, name);
      toast.success('Site added successfully');
      navigate(`/sites/${site.id}`);
    } catch (err) {
      console.error('Error adding site:', err);
      setError(err instanceof Error ? err.message : 'Failed to add site. Please try again.');
      toast.error('Failed to add site');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppLayout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Add New Site</h1>
          <p className="mt-2 text-gray-600">
            Enter your website details to start analyzing and optimizing for AI visibility.
          </p>
        </div>

        <div className="max-w-3xl">
          <Card>
            {error && (
              <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-red-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}
            
            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                <div>
                  <Input
                    id="name"
                    label="Site Name"
                    type="text"
                    placeholder="My Awesome Website"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                
                <div>
                  <Input
                    id="url"
                    label="Website URL"
                    type="text"
                    placeholder="https://example.com"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    helperText="Enter a public website URL. Local URLs (localhost) and private network addresses cannot be analyzed."
                    required
                  />
                </div>

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    variant="primary"
                    isLoading={isLoading}
                    icon={<Globe size={16} />}
                  >
                    Add Site
                  </Button>
                </div>
              </div>
            </form>
          </Card>
        </div>
      </motion.div>
    </AppLayout>
  );
};

export default AddSite