import React from 'react';
import { OrdersManagerView } from '../components/orders_manager_view';

import type { Product } from '../types/product';

interface OrdersPageProps {
  products?: Product[];
  onOpenBulkMatcher: () => void;
}

export const OrdersPage: React.FC<OrdersPageProps> = ({ products = [], onOpenBulkMatcher }) => {
  return (
    <div className="space-y-6">
      <OrdersManagerView products={products} onOpenBulkMatcher={onOpenBulkMatcher} />
    </div>
  );
};
