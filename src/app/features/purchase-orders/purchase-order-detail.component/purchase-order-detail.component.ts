import { CommonModule, Location } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { MaterialModule } from '../../../shared/material-module';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { PurchaseOrderService } from '../../../core/services/purchase-order.service';
import { NotificationService } from '../../../core/services/notification.service';
import { getStatusConfig } from '../../../core/utils/purchase-order-status.util';
import { PurchaseOrderStatus } from '../../../shared/models/purchase-order-status.enum';
import { PurchaseOrderStatusUpdateRequestDTO } from '../../../shared/models/purchase-order.models';

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
  private location = inject(Location);
  private purchaseOrderService = inject(PurchaseOrderService);
  private notify = inject(NotificationService);

  orderId!: number;
  order: any = null;
  isLoading = false;
  errorMessage = '';

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

  printPdf(): void {
      // Oculta el sidebar antes de imprimir
  const sidebar = document.querySelector('mat-sidenav');
  const header = document.querySelector('.form-page-header');
  const infoCard = document.querySelector('.info-card');

  if (sidebar) (sidebar as HTMLElement).style.display = 'none';
  if (header) (header as HTMLElement).style.display = 'none';
  if (infoCard) (infoCard as HTMLElement).style.display = 'none';

  // Imprime
  window.print();

  // Restaura después de imprimir
  setTimeout(() => {
    if (sidebar) (sidebar as HTMLElement).style.display = '';
    if (header) (header as HTMLElement).style.display = '';
    if (infoCard) (infoCard as HTMLElement).style.display = '';
  }, 1000);
  }

  goBack(): void   { this.router.navigate(['/purchase-orders'])}

}
