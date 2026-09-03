import React from 'react';
import { ChallanView } from '../components/challan/ChallanView';

interface CreateChallanPageProps {
  onOpenBulkMatcher: () => void;
}

export const CreateChallanPage: React.FC<CreateChallanPageProps> = ({ onOpenBulkMatcher }) => {
  return (
    <div className="space-y-6">
      <ChallanView defaultSubTab="create" onOpenBulkMatcher={onOpenBulkMatcher} />
    </div>
  );
};
