import type { FactoryOrder } from '../../../types/challan';
import type { Product } from '../../../types/product';

export const getProductForOrder = (order: FactoryOrder, products: Product[]): Product | null => {
  return (
    products.find((p) => p.id === order.productId) ||
    products.find((p) => p.code === order.productCode) ||
    null
  );
};

export const getOrderProductDisplayName = (order: FactoryOrder, products: Product[]): string => {
  const prod = getProductForOrder(order, products);
  const code = order.productCode || prod?.code || '';
  const name = order.productName || prod?.name || order.title;
  return code ? `${code} — ${name}` : name;
};
