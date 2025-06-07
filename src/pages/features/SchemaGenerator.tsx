import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Code2, Copy, Check } from 'lucide-react';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { useSite } from '../../contexts/SiteContext';
import { schemaApi } from '../../lib/api';
import AppLayout from '../../components/layout/AppLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import toast from 'react-hot-toast';

const SchemaGenerator = () => {
  const { currentPlan } = useSubscription();
  const { selectedSite, sites } = useSite();
  const [schemaType, setSchemaType] = useState('');
  const [generatedSchema, setGeneratedSchema] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Get schema generation level based on plan
  const schemaLevel = currentPlan?.limits.features.schemaGeneration || 'basic';

  // Filter schema types based on plan level
  const schemaTypes = [
    { value: 'FAQ', label: 'FAQ', minLevel: 'basic' },
    { value: 'HowTo', label: 'How-To Guide', minLevel: 'basic' },
    { value: 'Product', label: 'Product', minLevel: 'basic' },
    { value: 'LocalBusiness', label: 'Local Business', minLevel: 'advanced' },
    { value: 'Article', label: 'Article', minLevel: 'advanced' },
    { value: 'Event', label: 'Event', minLevel: 'advanced' },
    { value: 'Organization', label: 'Organization', minLevel: 'custom' }
  ].filter(type => {
    switch (schemaLevel) {
      case 'custom':
        return true;
      case 'advanced':
        return type.minLevel !== 'custom';
      default:
        return type.minLevel === 'basic';
    }
  });

  const handleGenerateSchema = async () => {
    if (!selectedSite || !schemaType) {
      toast.error('Please select a schema type');
      return;
    }
    
    setIsGenerating(true);
    
    try {
      const result = await schemaApi.generateSchema(selectedSite.url, schemaType);
      setGeneratedSchema(result.schema);
      toast.success('Schema generated successfully');
    } catch (error) {
      console.error('Error generating schema:', error);
      toast.error('Failed to generate schema');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedSchema);
    setIsCopied(true);
    toast.success('Schema copied to clipboard');
    
    setTimeout(() => {
      setIsCopied(false);
    }, 2000);
  };

  // Show empty state if no sites
  if (!sites || sites.length === 0) {
    return (
      <AppLayout>
        <EmptyState
          title="No sites added yet"
          description="Add your first site to start generating schema markup."
          icon={<Code2 size={24} />}
          actionLabel="Add Your First Site"
          onAction={() => window.location.href = '/add-site'}
        />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Schema.org Generator</h1>
          <p className="mt-2 text-gray-600">
            Create structured data markup that helps AI systems understand your content more effectively.
          </p>
          {selectedSite && (
            <div className="mt-2 text-sm text-gray-500">
              Generating schema for: <span className="font-medium text-gray-700">{selectedSite.name}</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <Card>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Generate Schema</h2>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="schemaType" className="block text-sm font-medium text-gray-700 mb-1">
                    Schema Type
                  </label>
                  <select
                    id="schemaType"
                    name="schemaType"
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    value={schemaType}
                    onChange={(e) => setSchemaType(e.target.value)}
                  >
                    <option value="">Select a schema type</option>
                    {schemaTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <Button
                    variant="primary"
                    className="w-full"
                    onClick={handleGenerateSchema}
                    isLoading={isGenerating}
                    disabled={!selectedSite}
                    icon={<Code2 size={16} />}
                  >
                    Generate Schema
                  </Button>
                </div>
              </div>
            </Card>
            
            <Card className="mt-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Why Use Schema?</h2>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start">
                  <span className="h-5 w-5 text-green-500 mr-2">✓</span>
                  <span>Helps AI systems understand your content</span>
                </li>
                <li className="flex items-start">
                  <span className="h-5 w-5 text-green-500 mr-2">✓</span>
                  <span>Improves chances of appearing in rich snippets</span>
                </li>
                <li className="flex items-start">
                  <span className="h-5 w-5 text-green-500 mr-2">✓</span>
                  <span>Increases relevance for voice assistants</span>
                </li>
                <li className="flex items-start">
                  <span className="h-5 w-5 text-green-500 mr-2">✓</span>
                  <span>Enhances overall AI visibility score</span>
                </li>
                <li className="flex items-start">
                  <span className="h-5 w-5 text-green-500 mr-2">✓</span>
                  <span>Provides clear signals about your page's purpose</span>
                </li>
              </ul>
            </Card>
          </div>
          
          <div className="lg:col-span-2">
            <Card>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium text-gray-900">Generated Schema</h2>
                {generatedSchema && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyToClipboard}
                    icon={isCopied ? <Check size={16} /> : <Copy size={16} />}
                  >
                    {isCopied ? 'Copied!' : 'Copy'}
                  </Button>
                )}
              </div>
              
              {generatedSchema ? (
                <div className="bg-gray-50 p-4 rounded-md overflow-auto max-h-[600px]">
                  <pre className="text-sm font-mono">{generatedSchema}</pre>
                </div>
              ) : (
                <div className="bg-gray-50 p-8 rounded-md text-center">
                  <Code2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">
                    Select a schema type to generate markup for {selectedSite?.name || 'your site'}.
                  </p>
                </div>
              )}
              
              {generatedSchema && (
                <div className="mt-6">
                  <h3 className="text-md font-medium text-gray-900 mb-2">How to Implement:</h3>
                  <ol className="list-decimal list-inside space-y-2 text-gray-600">
                    <li>Copy the generated schema</li>
                    <li>Paste it into a <code className="bg-gray-100 px-1 py-0.5 rounded text-sm">&lt;script type="application/ld+json"&gt;</code> tag</li>
                    <li>Add the script to the <code className="bg-gray-100 px-1 py-0.5 rounded text-sm">&lt;head&gt;</code> section of your HTML</li>
                    <li>Test using <a href="https://validator.schema.org/" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-500">Schema.org Validator</a></li>
                  </ol>
                </div>
              )}
            </Card>
          </div>
        </div>
      </motion.div>
    </AppLayout>
  );
};

export default SchemaGenerator;