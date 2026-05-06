// sale-detail.component.ts  →  features/pos/sale-detail/sale-detail.component.ts

import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MaterialModule } from '../../../shared/material-module';
import { HasRoleDirective } from '../../../core/directives/has-role.directive';
import { SaleService } from '../../../core/services/sale.service';
import { NotificationService } from '../../../core/services/notification.service';
import { SaleResponse, SaleReturnResponse } from '../../../shared/models/sale.models';
import { getSaleStatusConfig } from '../../../core/utils/sale-status.util';;
import Swal from 'sweetalert2';
import { SaleReceiptDialogComponent } from '../../pos/sale-receipt-dialog/sale-receipt-dialog.component';
import { SaleReturnDialogComponent } from '../sale-return-dialog.component/sale-return-dialog.component';
import { SaleReturnReceiptDialogComponent } from '../sale-return-receipt-dialog.component/sale-return-receipt-dialog.component';

@Component({
  selector: 'app-sale-detail',
  standalone: true,
  imports: [CommonModule, MaterialModule, HasRoleDirective, CurrencyPipe, DatePipe],
  templateUrl: './sale-detail.component.html',
  styleUrl: './sale-detail.component.scss'
})
export class SaleDetailComponent implements OnInit {

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private saleService = inject(SaleService);
  private notify = inject(NotificationService);
  private dialog = inject(MatDialog);

  sale: SaleResponse | null = null;
  returns: SaleReturnResponse[] = [];
  isLoading = true;
  isCancelling = false;

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.loadSale(id);
  }

  loadSale(id: number): void {
    this.isLoading = true;
    this.saleService.getById(id).subscribe({
      next: (res) => {
        this.sale = res.data;
        this.loadReturns(id);
        this.isLoading = false;
      },
      error: () => {
        this.notify.error('Error', 'No se encontró la venta');
        this.goBack();
      }
    });
  }

  loadReturns(saleId: number): void {
    this.saleService.getReturnsBySale(saleId).subscribe({
      next: (res) => { this.returns = res.data ?? []; }
    });
  }

  // ── Acciones ──────────────────────────────────────────────

  openReceipt(): void {
    if (!this.sale) return;
    this.dialog.open(SaleReceiptDialogComponent, {
      width: '420px',
      data: { sale: this.sale },
      panelClass: 'receipt-dialog'
    });
  }

  openReturnDialog(): void {
    if (!this.sale) return;
    this.dialog.open(SaleReturnDialogComponent, {
      width: '680px',
      data: { sale: this.sale },
      disableClose: true
    }).afterClosed().subscribe(success => {
      if (success) {
        this.loadSale(this.sale!.id);
      }
    });
  }

  openReturnReceipt(ret: SaleReturnResponse): void {
    this.dialog.open(SaleReturnReceiptDialogComponent, {
      width: '420px',
      data: { saleReturn: ret },
      panelClass: 'receipt-dialog'
    });
}

  async cancelSale(): Promise<void> {
    if (!this.sale) return;

    const { value: reason } = await Swal.fire({
      title: '¿Cancelar esta venta?',
      text: 'Esta acción revertirá el stock de todos los productos',
      input: 'textarea',
      inputLabel: 'Motivo de cancelación',
      inputPlaceholder: 'Ej: Error en el cobro, el cliente se arrepintió...',
      showCancelButton: true,
      confirmButtonColor: '#e91e63',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, cancelar venta',
      cancelButtonText: 'No, mantener',
      inputValidator: (value) => {
        if (!value?.trim()) return 'El motivo es obligatorio';
        return null;
      }
    });

    if (!reason) return;

    this.isCancelling = true;
    this.saleService.cancelSale(this.sale.id, { reason }).subscribe({
      next: (res) => {
        this.sale = res.data;
        this.isCancelling = false;
        this.notify.success('Venta cancelada', 'El stock fue revertido correctamente');
      },
      error: (err) => {
        this.isCancelling = false;
        this.notify.error('Error', err.error?.message || 'No se pudo cancelar la venta');
      }
    });
  }

  // ── Helpers template ──────────────────────────────────────

  get statusConfig() {
    return this.sale ? getSaleStatusConfig(this.sale.status) : null;
  }

  get canCancel(): boolean {
    return this.sale?.status === 'COMPLETADA';
  }

  get canReturn(): boolean {
    if (!this.sale) return false;
    return this.sale.status === 'COMPLETADA' || this.sale.status === 'DEVUELTA_PARCIAL';
  }

  getPaymentLabel(method: string): string {
    const labels: Record<string, string> = {
      EFECTIVO: 'Efectivo', TARJETA: 'Tarjeta', TRANSFERENCIA: 'Transferencia'
    };
    return labels[method] ?? method;
  }

  getPaymentIcon(method: string): string {
    const icons: Record<string, string> = {
      EFECTIVO: 'payments', TARJETA: 'credit_card', TRANSFERENCIA: 'account_balance'
    };
    return icons[method] ?? 'attach_money';
  }

  goBack(): void { this.router.navigate(['/pos/sales']); }
}
