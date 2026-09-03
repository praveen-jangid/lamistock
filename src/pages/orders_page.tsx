import React from 'react';
import { OrdersManagerView } from '../components/orders_manager_view';

interface OrdersPageProps {
  onOpenBulkMatcher: () => void;
}

export const OrdersPage: React.FC<OrdersPageProps> = ({ onOpenBulkMatcher }) => {
  return (
    <div className="space-y-6">
      <OrdersManagerView onOpenBulkMatcher={onOpenBulkMatcher} />
    </div>
  );
};
