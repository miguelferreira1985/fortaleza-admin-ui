import { SaleStatus } from '../../shared/models/sale.models';

export interface StatusConfig {
  label: string;
  cssClass: string;
  icon: string;
}

export function getSaleStatusConfig(status: SaleStatus | string): StatusConfig {
  const map: Record<string, StatusConfig> = {
    COMPLETADA: {
      label: 'Completada',
      cssClass: 'status-completada',
      icon: 'check_circle'
    },
    CANCELADA: {
      label: 'Cancelada',
      cssClass: 'status-cancelada',
      icon: 'cancel'
    },
    DEVUELTA: {
      label: 'Devuelta',
      cssClass: 'status-devuelta',
      icon: 'assignment_return'
    },
    DEVUELTA_PARCIAL: {
      label: 'Dev. parcial',
      cssClass: 'status-devuelta-parcial',
      icon: 'remove_shopping_cart'
    }
  };
  return map[status] ?? { label: status, cssClass: '', icon: 'help' };
}
