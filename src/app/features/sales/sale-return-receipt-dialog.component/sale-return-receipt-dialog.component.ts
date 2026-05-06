import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Component, Inject } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogModule
} from '@angular/material/dialog';
import { MaterialModule } from '../../../shared/material-module';
import { SaleReturnResponse } from '../../../shared/models/sale.models';

@Component({
  selector: 'app-sale-return-receipt-dialog',
  standalone: true,
  imports: [CommonModule, MaterialModule, MatDialogModule, CurrencyPipe, DatePipe],
  template: `
    <!-- Botones de acción — se ocultan al imprimir -->
    <div class="receipt-actions no-print">
      <button mat-button mat-dialog-close>
        <mat-icon>close</mat-icon> Cerrar
      </button>
      <button mat-raised-button color="primary" (click)="print()">
        <mat-icon>print</mat-icon> Imprimir ticket
      </button>
    </div>

    <!-- Ticket -->
    <div class="receipt" id="return-receipt-content">

      <div class="receipt-header">
        <mat-icon class="receipt-logo">storefront</mat-icon>
        <h2>La Fortaleza</h2>
        <p class="receipt-subtitle">Mercería y haberdashería</p>
      </div>

      <div class="receipt-divider">────────────────────</div>

      <!-- Badge de devolución -->
      <div class="return-badge">
        <mat-icon>assignment_return</mat-icon>
        TICKET DE DEVOLUCIÓN
      </div>

      <div class="receipt-divider">────────────────────</div>

      <!-- Metadatos -->
      <div class="receipt-meta">
        <div class="meta-row">
          <span>Folio dev.:</span>
          <strong class="folio-devolucion">{{ saleReturn.folio }}</strong>
        </div>
        <div class="meta-row">
          <span>Ref. venta:</span>
          <strong>{{ saleReturn.saleFolio }}</strong>
        </div>
        <div class="meta-row">
          <span>Fecha:</span>
          <strong>{{ saleReturn.returnDate | date:'dd/MM/yyyy HH:mm' }}</strong>
        </div>
        <div class="meta-row">
          <span>Atendió:</span>
          <strong>{{ saleReturn.employeeName }}</strong>
        </div>
        <div class="meta-row">
          <span>Tipo:</span>
          <strong>{{ saleReturn.returnType === 'TOTAL' ? 'Devolución total' : 'Devolución parcial' }}</strong>
        </div>
        <div class="meta-row">
          <span>Motivo:</span>
          <strong class="reason-text">{{ saleReturn.reason }}</strong>
        </div>
      </div>

      <div class="receipt-divider">────────────────────</div>

      <!-- Artículos devueltos -->
      <p class="section-title">ARTÍCULOS DEVUELTOS</p>

      <div class="receipt-items">
        @for (item of saleReturn.items; track item.id) {
          <div class="receipt-item">
            <div class="item-name">{{ item.productName }}</div>
            <div class="item-detail">
              Cant. devuelta: <strong>{{ item.quantityReturned }}</strong>
            </div>
            <div class="item-refund">
              - {{ item.refundAmount | currency:'MXN':'symbol':'1.2-2' }}
            </div>
          </div>
        }
      </div>

      <div class="receipt-divider">────────────────────</div>

      <!-- Total reembolsado -->
      <div class="receipt-total">
        <span>TOTAL DEVUELTO</span>
        <strong>{{ saleReturn.totalRefuned | currency:'MXN':'symbol':'1.2-2' }}</strong>
      </div>

      <div class="refund-method-row">
        <mat-icon>{{ getRefundIcon() }}</mat-icon>
        <span>Reembolso en: <strong>{{ getRefundLabel() }}</strong></span>
      </div>

      <div class="receipt-divider">────────────────────</div>

      <div class="receipt-footer">
        <p>Conserve este comprobante</p>
        <p>La Fortaleza — Devoluciones</p>
      </div>

    </div>
  `,
  styles: [`
    :host { display: block; }

    .receipt-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      border-bottom: 1px solid #fce4ec;
    }

    .receipt {
      padding: 20px;
      font-family: 'Courier New', monospace;
      font-size: 13px;
      max-width: 320px;
      margin: 0 auto;
    }

    .receipt-header {
      text-align: center;
      mat-icon.receipt-logo {
        font-size: 40px; width: 40px; height: 40px; color: #880e4f;
      }
      h2 { margin: 4px 0 2px; font-size: 1.3rem; color: #880e4f; }
      .receipt-subtitle { margin: 0; font-size: 0.8rem; color: #888; }
    }

    .receipt-divider {
      text-align: center; color: #bbb;
      margin: 8px 0; font-size: 0.85rem;
    }

    .return-badge {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      background: #fff3e0;
      color: #e65100;
      border: 1px dashed #ffb74d;
      border-radius: 6px;
      padding: 6px 12px;
      font-weight: 700;
      font-size: 0.85rem;
      text-align: center;
      mat-icon { font-size: 18px; width: 18px; height: 18px; }
    }

    .receipt-meta {
      .meta-row {
        display: flex;
        justify-content: space-between;
        padding: 2px 0;
        font-size: 0.82rem;
        span { color: #666; flex-shrink: 0; margin-right: 8px; }
        strong { color: #333; text-align: right; }
        .folio-devolucion { color: #e65100; }
        .reason-text {
          color: #555;
          font-style: italic;
          font-size: 0.78rem;
          text-align: right;
          max-width: 180px;
          word-break: break-word;
        }
      }
    }

    .section-title {
      font-size: 0.78rem;
      font-weight: 700;
      color: #888;
      margin: 0 0 6px;
      letter-spacing: 0.5px;
    }

    .receipt-items {
      .receipt-item {
        padding: 5px 0;
        border-bottom: 1px dashed #eee;
        &:last-child { border: none; }

        .item-name {
          font-weight: 600; font-size: 0.85rem; color: #333;
        }
        .item-detail {
          font-size: 0.78rem; color: #666; margin-top: 1px;
          strong { color: #333; }
        }
        .item-refund {
          text-align: right;
          font-weight: 700;
          font-size: 0.88rem;
          color: #e65100;
          margin-top: 1px;
        }
      }
    }

    .receipt-total {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 1.1rem;
      padding: 4px 0;
      strong { font-size: 1.25rem; color: #2e7d32; }
    }

    .refund-method-row {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.82rem;
      color: #555;
      padding: 4px 0;
      mat-icon { font-size: 16px; width: 16px; height: 16px; color: #e91e63; }
      strong { color: #333; }
    }

    .receipt-footer {
      text-align: center;
      color: #888;
      font-size: 0.8rem;
      p { margin: 3px 0; }
    }

    @media print {
      .no-print { display: none !important; }
      .receipt { padding: 0; margin: 0; max-width: 100%; }
    }
  `]
})
export class SaleReturnReceiptDialogComponent {

  saleReturn: SaleReturnResponse;

  constructor(
    @Inject(MAT_DIALOG_DATA) data: { saleReturn: SaleReturnResponse },
    private dialogRef: MatDialogRef<SaleReturnReceiptDialogComponent>
  ) {
    this.saleReturn = data.saleReturn;
  }

  getRefundLabel(): string {
    const labels: Record<string, string> = {
      EFECTIVO: 'Efectivo',
      TARJETA: 'Tarjeta',
      TRANSFERENCIA: 'Transferencia'
    };
    return labels[this.saleReturn.refundMethod] ?? this.saleReturn.refundMethod;
  }

  getRefundIcon(): string {
    const icons: Record<string, string> = {
      EFECTIVO: 'payments',
      TARJETA: 'credit_card',
      TRANSFERENCIA: 'account_balance'
    };
    return icons[this.saleReturn.refundMethod] ?? 'attach_money';
  }

  print(): void {
    window.print();
  }
}
