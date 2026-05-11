import { PurchaseOrderStatus } from "../../shared/models/purchase-order-status.enum";

export interface StatusConfig {
  label: string;
  cssClass: string;
  icon: string;
}

export function getStatusConfig(status: string): StatusConfig {
    const map: Record<string, StatusConfig> = {
    [PurchaseOrderStatus.PENDIENTE]: {
      label: 'Pendiente',
      cssClass: 'status-pendiente',
      icon: 'schedule'
    },
    [PurchaseOrderStatus.PARCIALMENTE_RECIBIDA]: {
      label: 'Parcialmente recibida',
      cssClass: 'status-parcial',
      icon: 'local_shipping'
    },
    [PurchaseOrderStatus.COMPLETADA]: {
      label: 'Completada',
      cssClass: 'status-completada',
      icon: 'check_circle'
    },
    [PurchaseOrderStatus.CANCELADA]: {
      label: 'Cancelada',
      cssClass: 'status-cancelada',
      icon: 'cancel'
    },
  };
  return map[status] ?? { label: status, cssClass: '', icon: 'help' };
}
