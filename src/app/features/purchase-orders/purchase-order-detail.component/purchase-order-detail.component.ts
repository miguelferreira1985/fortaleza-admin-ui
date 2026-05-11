import { CommonModule, Location } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { MaterialModule } from '../../../shared/material-module';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { PurchaseOrderService } from '../../../core/services/purchase-order.service';
import { NotificationService } from '../../../core/services/notification.service';
import { getStatusConfig } from '../../../core/utils/purchase-order-status.util';
import { PurchaseOrderStatus } from '../../../shared/models/purchase-order-status.enum';
import { PurchaseOrderStatusUpdateRequestDTO } from '../../../shared/models/purchase-order.models';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-purchase-order-detail.component',
  imports: [
    CommonModule,
    MaterialModule,
    RouterModule
  ],
  templateUrl: './purchase-order-detail.component.html',
  styleUrl: './purchase-order-detail.component.scss',
})
export class PurchaseOrderDetailComponent implements OnInit {


  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private purchaseOrderService = inject(PurchaseOrderService);
  private notify = inject(NotificationService);

  orderId!: number;
  order: any = null;
  isLoading = false;
  isLoadingPdf = false;
  errorMessage = '';

  intertalPdfTemplateName = 'purchase-order-internal-pdf';
  externalPdfTemplateName = 'purchase-order-external-pdf';

  readonly getStatusConfig = getStatusConfig;
  readonly statusEnum = PurchaseOrderStatus;

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (!idParam || isNaN(+idParam)) {
      this.errorMessage = 'ID de orden inválido'; return;
    }
    this.orderId = +idParam;
    this.loadOrder();
  }

  loadOrder(): void {
    this.isLoading = true;
    this.purchaseOrderService.getById(this.orderId).subscribe({
      next: res => { this.order = res.data ?? res; this.isLoading = false; },
      error: err => {
        this.errorMessage = err?.error?.message || 'No se pudo cargar la orden';
        this.notify.error('Error', this.errorMessage);
        this.isLoading = false;
      }
    });
  }

  getPending(item: any): number {
    return Number(item.quantityOrdered || 0) - Number(item.quantityReceived || 0);
  }

  get canEdit(): boolean      { return this.order?.status === 'PENDIENTE'; }
  get canCancel(): boolean    { return this.order?.status === 'PENDIENTE'; }
  get canComplete(): boolean  { return ['PENDIENTE','PARCIALMENTE_RECIBIDA'].includes(this.order?.status); }
  get canReceive(): boolean   { return ['PENDIENTE','PARCIALMENTE_RECIBIDA'].includes(this.order?.status); }

  goReceive(): void {
    this.router.navigate(['/purchase-orders', this.orderId, 'receive']);
  }

  completeOrder(): void {
    this.notify.confirm('¿Completar orden?', `¿Marcas la orden #${this.orderId} como completada?`)
      .then((confirmed) => {
        if (confirmed) this.updateStatus(PurchaseOrderStatus.COMPLETADA);
      });
  }

  cancelOrder(): void {
    this.notify.confirm('¿Cancelar orden?', `¿Cancelas la orden #${this.orderId}? Esta acción no se puede deshacer.`)
      .then((confirmed) => {
        if (confirmed) this.updateStatus(PurchaseOrderStatus.CANCELADA);
      });
  }

  private updateStatus(status: PurchaseOrderStatus): void {
    const req: PurchaseOrderStatusUpdateRequestDTO = { newStatus: status };
    this.isLoading = true;
    this.purchaseOrderService.updateStatus(this.orderId, req).subscribe({
      next: res => { this.order = res.data ?? res; this.isLoading = false; },
      error: err => {
        this.notify.error('Error', err.error?.message);
        this.isLoading = false;
      }
    });
  }

  printInternalOrder(templateName: string): void {

    this.isLoadingPdf = true;

    this.purchaseOrderService.downloadPurchaseOrderPdf(this.order.id, templateName).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const windowRef = window.open(url, '_blank');

        if (windowRef) {
          windowRef.onload = () => {
            window.URL.revokeObjectURL(url);
          };
        }

        this.isLoadingPdf = false;
      },
      error: (err) => {
        this.isLoadingPdf = false;
        this.notify.error('Error', 'No se pudo generar el PDF');
      }
    });
  }

  goBack(): void   { this.router.navigate(['/purchase-orders'])}

}
