import React from 'react';
import { ChallanView } from '../components/challan_view';

interface ChallansPageProps {
  onOpenBulkMatcher: () => void;
}

export const ChallansPage: React.FC<ChallansPageProps> = ({ onOpenBulkMatcher }) => {
  return (
    <div className="space-y-6">
      <ChallanView defaultSubTab="history" onOpenBulkMatcher={onOpenBulkMatcher} />
    </div>
  );
};
