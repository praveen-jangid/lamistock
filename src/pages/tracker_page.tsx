import React from 'react';
import { ChallanView } from '../components/challan_view';

interface TrackerPageProps {
  onOpenBulkMatcher: () => void;
}

export const TrackerPage: React.FC<TrackerPageProps> = ({ onOpenBulkMatcher }) => {
  return (
    <div className="space-y-6">
      <ChallanView defaultSubTab="tracker" onOpenBulkMatcher={onOpenBulkMatcher} />
    </div>
  );
};
