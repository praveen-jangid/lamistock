import React from 'react';
import { useNavigate } from 'react-router-dom';
import { getSavedOrders } from '../../services/challanDb';
import {
  FileSpreadsheet,
  Plus,
  Truck,
  Sparkles,
  Layers,
  Calendar,
  CheckCircle2
} from 'lucide-react';

interface OrdersManagerViewProps {
  onOpenBulkMatcher: () => void;
  onCreateChallanForOrder?: (orderId: string) => void;
}

export const OrdersManagerView: React.FC<OrdersManagerViewProps> = ({
  onOpenBulkMatcher,
  onCreateChallanForOrder
}) => {
  const navigate = useNavigate();
  const orders = getSavedOrders();

  return (
    <div className="orders-manager-container">
      {/* Banner */}
      <div className="orders-banner">
        <div className="orders-banner-left">
          <div className="orders-banner-icon">
            <FileSpreadsheet size={24} />
          </div>
          <div>
            <h2 className="orders-banner-title">Production Orders & Cutting Lists</h2>
            <p className="orders-banner-sub">
              Manage furniture orders uploaded via Excel, check stock matches, and dispatch panels to Unit 1.
            </p>
          </div>
        </div>

        <div className="orders-banner-right">
          <button
            type="button"
            className="btn-primary-large"
            onClick={onOpenBulkMatcher}
          >
            <Plus size={16} />
            <span>Upload New Excel Order (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* Orders Grid */}
      <div className="orders-grid-stack">
        {orders.map((ord) => {
          const totalLamPcs = ord.laminationItems.reduce((s, it) => s + it.quantityNeeded, 0);
          const totalFrmPcs = ord.frameItems.reduce((s, it) => s + it.quantity, 0);

          return (
            <div key={ord.id} className="factory-order-card">
              <div className="order-card-top">
                <div className="order-id-group">
                  <span className="order-num-pill font-mono font-bold">{ord.orderNumber}</span>
                  <h3 className="order-card-title">{ord.title}</h3>
                </div>

                <div className="order-meta-info">
                  <span className="order-date-tag">
                    <Calendar size={13} /> {ord.date}
                  </span>
                  <span className="order-status-badge">
                    <CheckCircle2 size={13} /> In Production
                  </span>
                </div>
              </div>

              {ord.notes && <p className="order-notes-line">📝 {ord.notes}</p>}

              {/* Order Contents Overview */}
              <div className="order-components-summary-row">
                <div className="comp-summary-box">
                  <div className="comp-box-header">
                    <Layers size={14} className="text-emerald" />
                    <strong>Lamination Panels:</strong>
                  </div>
                  <div className="comp-box-body">
                    <span className="comp-metric font-mono font-bold">{totalLamPcs} pcs</span>
                    <span className="comp-subtext">across {ord.laminationItems.length} panel sizes</span>
                  </div>
                </div>

                <div className="comp-summary-box">
                  <div className="comp-box-header">
                    <Truck size={14} className="text-amber" />
                    <strong>Frame Components:</strong>
                  </div>
                  <div className="comp-box-body">
                    <span className="comp-metric font-mono font-bold">{totalFrmPcs} pcs</span>
                    <span className="comp-subtext">across {ord.frameItems.length} frame parts</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="order-card-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={onOpenBulkMatcher}
                  title="Check what panels are in Firestore stock to avoid making duplicates"
                >
                  <Sparkles size={15} />
                  <span>Check Extra Stock in Cloud</span>
                </button>

                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => {
                    if (onCreateChallanForOrder) onCreateChallanForOrder(ord.id);
                    navigate(`/challans/new?orderId=${ord.id}`);
                  }}
                >
                  <Truck size={15} />
                  <span>Create Outward Challan for Unit 1</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
