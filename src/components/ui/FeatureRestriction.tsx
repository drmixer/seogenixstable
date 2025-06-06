import React from 'react';
import { Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from './Button';

interface FeatureRestrictionProps {
  title: string;
  description: string;
  requiredPlan: string;
}

const FeatureRestriction: React.FC<FeatureRestrictionProps> = ({
  title,
  description,
  requiredPlan
}) => {
  return (
    <div className="text-center py-12">
      <Lock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 mb-6 max-w-md mx-auto">
        {description}
      </p>
      <p className="text-sm text-gray-600 mb-4">
        Available on the <span className="font-medium">{requiredPlan}</span> plan and above
      </p>
      <Link to="/account-settings">
        <Button variant="primary">
          Upgrade Now
        </Button>
      </Link>
    </div>
  );
};

export default FeatureRestriction;