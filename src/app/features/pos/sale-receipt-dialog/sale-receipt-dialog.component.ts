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
      <img src="assets/images/FortalezaLogoBlanco.jpeg" alt="La Fortaleza" class="receipt-logo">
    </div>

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

      <!-- ✅ EFECTIVO RECIBIDO Y CAMBIO -->
      @if (hasEfectivo && cashReceived > 0) {
        <div class="receipt-divider-thin">- - - - - - - - - - - - -</div>
        <div class="payment-row cash-received">
          <span>Efectivo recibido:</span>
          <strong>{{ cashReceived | currency:'MXN':'symbol':'1.2-2' }}</strong>
        </div>
        @if (calculatedChange > 0) {
          <div class="payment-row change">
            <span>Cambio a entregar:</span>
            <strong>{{ calculatedChange | currency:'MXN':'symbol':'1.2-2' }}</strong>
          </div>
        }
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

    img.receipt-logo {
      width: 200px;              /* ✅ Ajusta el ancho según tu logo */
      height: auto;             /* ✅ Mantiene proporción */
      margin-bottom: 8px;       /* ✅ Espacio debajo del logo */
      display: block;
      margin-left: auto;
      margin-right: auto;
    }

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
          &.change {
            //color: #2e7d32;
            font-weight: 700;
          }
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

      body {
        margin: 0;
        padding: 0;
      }

      .receipt {
        padding: 8px;
        margin: 0 auto;
        max-width: 72mm;
        font-size: 12px;
        line-height: 1.3;
      }

      @page {
        size: 80mm auto;
        margin: 0;
      }

      img.receipt-logo {
        width: 200px;
      }

      .receipt-divider {
        font-size: 10px;
      }
    }
      .receipt-divider-thin {
    text-align: center;
    color: #ddd;
    margin: 4px 0;
    font-size: 0.75rem;
  }

  .receipt-payments {
    .payment-row {
      display: flex;
      justify-content: space-between;
      padding: 3px 0;
      font-size: 0.85rem;

      &.cash-received {
        //color: #1565c0;
        font-weight: 600;
      }

      &.change {
        //color: #2e7d32;
        font-weight: 700;
        font-size: 0.9rem;
        //background: #e8f5e9;
        padding: 6px 8px;
        border-radius: 4px;
        margin-top: 2px;
      }
    }
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

get cashReceived(): number {
  const cashPayment = this.sale.payments.find(p => p.paymentMethod === 'EFECTIVO');
  if (!cashPayment) return 0;

  return (cashPayment.cashReceived != null && cashPayment.cashReceived > 0)
    ? cashPayment.cashReceived
    : cashPayment.amount;
}

  get calculatedChange(): number {
    if (!this.hasEfectivo || this.cashReceived === 0) return 0;

    const cashPayment = this.sale.payments
      .filter(p => p.paymentMethod === 'EFECTIVO')
      .reduce((a, p) => a + p.amount, 0);

    const otherPayments = this.sale.payments
      .filter(p => p.paymentMethod !== 'EFECTIVO')
      .reduce((a, p) => a + p.amount, 0);

    const cashNeeded = this.sale.total - otherPayments;
    return Math.max(0, this.cashReceived - cashNeeded);
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
