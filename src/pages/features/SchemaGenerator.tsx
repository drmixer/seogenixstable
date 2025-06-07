import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Code2, Copy, Check, Download, ExternalLink } from 'lucide-react';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { schemaApi } from '../../lib/api';
import AppLayout from '../../components/layout/AppLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import toast from 'react-hot-toast';

const SchemaGenerator = () => {
  const { currentPlan } = useSubscription();
  const [url, setUrl] = useState('');
  const [schemaType, setSchemaType] = useState('');
  const [generatedSchema, setGeneratedSchema] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [dataSource, setDataSource] = useState('');

  // Get schema generation level based on plan
  const schemaLevel = currentPlan?.limits.features.schemaGeneration || 'basic';

  // Filter schema types based on plan level
  const schemaTypes = [
    { value: 'FAQ', label: 'FAQ Page', minLevel: 'basic', description: 'Frequently Asked Questions markup' },
    { value: 'HowTo', label: 'How-To Guide', minLevel: 'basic', description: 'Step-by-step instructions' },
    { value: 'Product', label: 'Product', minLevel: 'basic', description: 'Product information and offers' },
    { value: 'LocalBusiness', label: 'Local Business', minLevel: 'advanced', description: 'Local business information' },
    { value: 'Article', label: 'Article', minLevel: 'advanced', description: 'News articles and blog posts' },
    { value: 'Event', label: 'Event', minLevel: 'advanced', description: 'Events and happenings' },
    { value: 'Organization', label: 'Organization', minLevel: 'custom', description: 'Company and organization data' },
    { value: 'WebSite', label: 'Website', minLevel: 'custom', description: 'Website-level markup' },
    { value: 'BreadcrumbList', label: 'Breadcrumbs', minLevel: 'custom', description: 'Navigation breadcrumbs' }
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
    if (!url || !schemaType) {
      toast.error('Please enter a URL and select a schema type');
      return;
    }
    
    // Validate URL
    try {
      new URL(url.startsWith('http') ? url : `https://${url}`);
    } catch {
      toast.error('Please enter a valid URL');
      return;
    }
    
    setIsGenerating(true);
    setGeneratedSchema('');
    setDataSource('');
    
    try {
      const result = await schemaApi.generateSchema(url, schemaType);
      setGeneratedSchema(result.schema || result);
      setDataSource(result.dataSource || 'Generated');
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

  const downloadSchema = () => {
    const blob = new Blob([generatedSchema], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${schemaType.toLowerCase()}-schema.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Schema downloaded');
  };

  const validateSchema = () => {
    window.open('https://validator.schema.org/', '_blank');
  };

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
          {schemaLevel !== 'custom' && (
            <div className="mt-2 text-sm text-blue-600">
              Current plan: <span className="font-medium capitalize">{schemaLevel}</span> schema generation
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <Card>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Generate Schema</h2>
              
              <div className="space-y-4">
                <div>
                  <Input
                    id="url"
                    label="Website URL"
                    type="text"
                    placeholder="https://example.com"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                  />
                </div>
                
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
                  {schemaType && (
                    <p className="mt-1 text-sm text-gray-500">
                      {schemaTypes.find(t => t.value === schemaType)?.description}
                    </p>
                  )}
                </div>
                
                <div>
                  <Button
                    variant="primary"
                    className="w-full"
                    onClick={handleGenerateSchema}
                    isLoading={isGenerating}
                    icon={<Code2 size={16} />}
                  >
                    Generate Schema
                  </Button>
                </div>
              </div>
            </Card>
            
            <Card className="mt-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Schema Benefits</h2>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start">
                  <span className="h-5 w-5 text-green-500 mr-2 mt-0.5">✓</span>
                  <span>Helps AI systems understand your content structure and meaning</span>
                </li>
                <li className="flex items-start">
                  <span className="h-5 w-5 text-green-500 mr-2 mt-0.5">✓</span>
                  <span>Improves chances of appearing in rich snippets and featured results</span>
                </li>
                <li className="flex items-start">
                  <span className="h-5 w-5 text-green-500 mr-2 mt-0.5">✓</span>
                  <span>Increases relevance for voice assistants and AI chatbots</span>
                </li>
                <li className="flex items-start">
                  <span className="h-5 w-5 text-green-500 mr-2 mt-0.5">✓</span>
                  <span>Enhances overall AI visibility and citation potential</span>
                </li>
                <li className="flex items-start">
                  <span className="h-5 w-5 text-green-500 mr-2 mt-0.5">✓</span>
                  <span>Provides clear semantic signals about your page's purpose</span>
                </li>
              </ul>
            </Card>

            {schemaLevel !== 'custom' && (
              <Card className="mt-6 bg-blue-50 border border-blue-100">
                <h2 className="text-lg font-medium text-blue-800 mb-2">Upgrade for More</h2>
                <p className="text-blue-700 text-sm mb-3">
                  Get access to advanced schema types and custom templates with higher-tier plans.
                </p>
                <Button variant="primary" size="sm">
                  View Plans
                </Button>
              </Card>
            )}
          </div>
          
          <div className="lg:col-span-2">
            <Card>
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-lg font-medium text-gray-900">Generated Schema</h2>
                  {dataSource && (
                    <p className="text-sm text-gray-500 mt-1">Source: {dataSource}</p>
                  )}
                </div>
                {generatedSchema && (
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={validateSchema}
                      icon={<ExternalLink size={16} />}
                    >
                      Validate
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={downloadSchema}
                      icon={<Download size={16} />}
                    >
                      Download
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copyToClipboard}
                      icon={isCopied ? <Check size={16} /> : <Copy size={16} />}
                    >
                      {isCopied ? 'Copied!' : 'Copy'}
                    </Button>
                  </div>
                )}
              </div>
              
              {generatedSchema ? (
                <div className="bg-gray-50 p-4 rounded-md overflow-auto max-h-[600px]">
                  <pre className="text-sm font-mono whitespace-pre-wrap">{generatedSchema}</pre>
                </div>
              ) : (
                <div className="bg-gray-50 p-8 rounded-md text-center">
                  <Code2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">
                    Enter a URL and select a schema type to generate markup.
                  </p>
                </div>
              )}
              
              {generatedSchema && (
                <div className="mt-6">
                  <h3 className="text-md font-medium text-gray-900 mb-3">Implementation Guide:</h3>
                  <div className="bg-blue-50 p-4 rounded-md">
                    <ol className="list-decimal list-inside space-y-2 text-gray-700 text-sm">
                      <li>Copy the generated schema markup above</li>
                      <li>Wrap it in a <code className="bg-white px-1 py-0.5 rounded text-xs">&lt;script type="application/ld+json"&gt;</code> tag</li>
                      <li>Add the script to the <code className="bg-white px-1 py-0.5 rounded text-xs">&lt;head&gt;</code> section of your HTML</li>
                      <li>Test using the <a href="https://validator.schema.org/" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-500 underline">Schema.org Validator</a></li>
                      <li>Monitor your search results for rich snippet improvements</li>
                    </ol>
                  </div>
                  
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Example Implementation:</h4>
                    <div className="bg-gray-800 text-gray-100 p-3 rounded text-xs overflow-x-auto">
                      <code>{`<script type="application/ld+json">
${generatedSchema}
</script>`}</code>
                    </div>
                  </div>
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