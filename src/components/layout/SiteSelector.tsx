import React from 'react';
import { ChevronDown, Globe, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSites } from '../../contexts/SiteContext';

const SiteSelector: React.FC = () => {
  const { sites, selectedSite, setSelectedSite, loading } = useSites();

  if (loading) {
    return (
      <div className="flex items-center space-x-2 px-3 py-2 bg-gray-100 rounded-md animate-pulse">
        <div className="w-4 h-4 bg-gray-300 rounded"></div>
        <div className="w-24 h-4 bg-gray-300 rounded"></div>
      </div>
    );
  }

  if (sites.length === 0) {
    return (
      <Link
        to="/add-site"
        className="flex items-center space-x-2 px-3 py-2 bg-indigo-50 text-indigo-700 rounded-md hover:bg-indigo-100 transition-colors"
      >
        <Plus size={16} />
        <span className="text-sm font-medium">Add Your First Site</span>
      </Link>
    );
  }

  return (
    <div className="relative">
      <div className="flex items-center space-x-2 px-3 py-2 bg-white border border-gray-200 rounded-md shadow-sm">
        <Globe size={16} className="text-gray-400" />
        <select
          value={selectedSite?.id || ''}
          onChange={(e) => {
            const site = sites.find(s => s.id === e.target.value);
            setSelectedSite(site || null);
          }}
          className="flex-1 bg-transparent border-none outline-none text-sm font-medium text-gray-900 cursor-pointer"
        >
          {sites.map((site) => (
            <option key={site.id} value={site.id}>
              {site.name}
            </option>
          ))}
        </select>
        <ChevronDown size={16} className="text-gray-400" />
      </div>
    </div>
  );
};

export default SiteSelector;