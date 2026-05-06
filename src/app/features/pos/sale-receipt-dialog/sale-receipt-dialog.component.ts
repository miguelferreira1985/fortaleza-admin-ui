import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MaterialModule } from '../../../shared/material-module';
import { SaleResponse } from '../../../shared/models/sale.models';

@Component({
  selector: 'app-sale-receipt-dialog',
  standalone: true,
  imports: [CommonModule, MaterialModule, MatDialogModule, CurrencyPipe, DatePipe],
  template: `
    <!-- Botones de acción (se ocultan al imprimir) -->
    <div class="receipt-actions no-print">
      <button mat-button mat-dialog-close>
        <mat-icon>close</mat-icon> Cerrar
      </button>
      <button mat-raised-button color="primary" (click)="print()">
        <mat-icon>print</mat-icon> Imprimir ticket
      </button>
    </div>

    <!-- El ticket en sí -->
    <div class="receipt" id="receipt-content">
      <div class="receipt-header">
        <mat-icon class="receipt-logo">storefront</mat-icon>
        <h2>La Fortaleza</h2>
        <p class="receipt-subtitle">Mercería y haberdashería</p>
      </div>

      <div class="receipt-divider">────────────────────</div>

      <div class="receipt-meta">
        <div class="meta-row">
          <span>Folio:</span><strong>{{ sale.folio }}</strong>
        </div>
        <div class="meta-row">
          <span>Fecha:</span>
          <strong>{{ sale.saleDate | date:'dd/MM/yyyy HH:mm' }}</strong>
        </div>
        <div class="meta-row">
          <span>Cajero:</span><strong>{{ sale.employeeName }}</strong>
        </div>
        @if (sale.clientName) {
          <div class="meta-row">
            <span>Cliente:</span><strong>{{ sale.clientName }}</strong>
          </div>
        }
      </div>

      <div class="receipt-divider">────────────────────</div>

      <!-- Ítems -->
      <div class="receipt-items">
        @for (item of sale.items; track item.id) {
          <div class="receipt-item">
            <div class="item-name">{{ item.productName }}</div>
            <div class="item-detail">
              {{ item.quantity }} × {{ item.unitPrice | currency:'MXN':'symbol':'1.2-2' }}
              @if (item.discount > 0) {
                <span class="item-discount">({{ item.discount }}% desc.)</span>
              }
            </div>
            <div class="item-subtotal">{{ item.subtotal | currency:'MXN':'symbol':'1.2-2' }}</div>
          </div>
        }
      </div>

      <div class="receipt-divider">────────────────────</div>

      <!-- Pagos -->
      <div class="receipt-payments">
        @for (payment of sale.payments; track payment.id) {
          <div class="payment-row">
            <span>{{ getPaymentLabel(payment.paymentMethod) }}:</span>
            <strong>{{ payment.amount | currency:'MXN':'symbol':'1.2-2' }}</strong>
          </div>
        }
        @if (hasEfectivo && change > 0) {
          <div class="payment-row change">
            <span>Cambio:</span>
            <strong>{{ change | currency:'MXN':'symbol':'1.2-2' }}</strong>
          </div>
        }
      </div>

      <div class="receipt-divider">────────────────────</div>

      <div class="receipt-total">
        <span>TOTAL</span>
        <strong>{{ sale.total | currency:'MXN':'symbol':'1.2-2' }}</strong>
      </div>

      <div class="receipt-divider">────────────────────</div>

      <div class="receipt-footer">
        <p>¡Gracias por su compra!</p>
        <p>Precios con IVA incluido</p>
        @if (sale.toBeBilled) {
          <p class="billing-note">★ Marcada para facturar</p>
        }
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }

    .receipt-actions {
      display: flex; justify-content: space-between; align-items: center;
      padding: 12px 16px; border-bottom: 1px solid #fce4ec;
    }

    .receipt {
      padding: 20px;
      font-family: 'Courier New', monospace;
      font-size: 13px;
      max-width: 320px;
      margin: 0 auto;

      .receipt-header {
        text-align: center;
        mat-icon.receipt-logo { font-size: 40px; width: 40px; height: 40px; color: #880e4f; }
        h2 { margin: 4px 0 2px; font-size: 1.3rem; color: #880e4f; }
        .receipt-subtitle { margin: 0; font-size: 0.8rem; color: #888; }
      }

      .receipt-divider { text-align: center; color: #bbb; margin: 8px 0; font-size: 0.85rem; }

      .receipt-meta {
        .meta-row {
          display: flex; justify-content: space-between;
          padding: 2px 0; font-size: 0.82rem;
          span { color: #666; }
          strong { color: #333; }
        }
      }

      .receipt-items {
        .receipt-item {
          padding: 5px 0; border-bottom: 1px dashed #eee;
          &:last-child { border: none; }
          .item-name { font-weight: 600; font-size: 0.85rem; color: #333; }
          .item-detail { font-size: 0.8rem; color: #666; margin-top: 2px; }
          .item-discount { color: #e91e63; }
          .item-subtotal { text-align: right; font-weight: 700; font-size: 0.88rem; color: #333; margin-top: 2px; }
        }
      }

      .receipt-payments {
        .payment-row {
          display: flex; justify-content: space-between;
          padding: 2px 0; font-size: 0.85rem;
          &.change { color: #2e7d32; font-weight: 700; }
        }
      }

      .receipt-total {
        display: flex; justify-content: space-between; align-items: center;
        font-size: 1.15rem;
        strong { font-size: 1.3rem; color: #880e4f; }
      }

      .receipt-footer {
        text-align: center; color: #888; font-size: 0.8rem;
        p { margin: 3px 0; }
        .billing-note { color: #e91e63; font-weight: 700; }
      }
    }

    @media print {
      .no-print { display: none !important; }
      .receipt { padding: 0; margin: 0; max-width: 100%; }
    }
  `]
})
export class SaleReceiptDialogComponent {

  sale: SaleResponse;

  constructor(
    @Inject(MAT_DIALOG_DATA) data: { sale: SaleResponse },
    private dialogRef: MatDialogRef<SaleReceiptDialogComponent>
  ) {
    this.sale = data.sale;
  }

  get hasEfectivo(): boolean {
    return this.sale.payments.some(p => p.paymentMethod === 'EFECTIVO');
  }

  get change(): number {
    const cashAmt = this.sale.payments
      .filter(p => p.paymentMethod === 'EFECTIVO')
      .reduce((a, p) => a + p.amount, 0);
    const otherAmt = this.sale.payments
      .filter(p => p.paymentMethod !== 'EFECTIVO')
      .reduce((a, p) => a + p.amount, 0);
    return Math.max(0, cashAmt - (this.sale.total - otherAmt));
  }

  getPaymentLabel(method: string): string {
    const labels: Record<string, string> = {
      EFECTIVO: 'Efectivo', TARJETA: 'Tarjeta', TRANSFERENCIA: 'Transferencia'
    };
    return labels[method] ?? method;
  }

  print(): void {
    window.print();
  }
}
