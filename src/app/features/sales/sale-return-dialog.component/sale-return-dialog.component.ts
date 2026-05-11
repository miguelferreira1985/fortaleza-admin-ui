// sale-return-dialog.component.ts  →  features/pos/sale-return-dialog/sale-return-dialog.component.ts

import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, Inject, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MaterialModule } from '../../../shared/material-module';
import { SaleService } from '../../../core/services/sale.service';
import { NotificationService } from '../../../core/services/notification.service';
import {
  SaleResponse,
  SaleItemResponse,
  SaleReturnRequest,
  PaymentMethod,
  SaleReturnResponse
} from '../../../shared/models/sale.models';
import { SaleReturnReceiptDialogComponent } from '../sale-return-receipt-dialog.component/sale-return-receipt-dialog.component';

interface ReturnItemState {
  saleItem: SaleItemResponse;
  selected: boolean;
  quantityToReturn: number;
  alreadyReturned: number;  // cuánto ya fue devuelto antes
  availableToReturn: number;
  refundAmount: number;
}

@Component({
  selector: 'app-sale-return-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MaterialModule, MatDialogModule, CurrencyPipe],
  templateUrl: './sale-return-dialog.component.html',
  styleUrl: './sale-return-dialog.component.scss'
})
export class SaleReturnDialogComponent implements OnInit {

  private saleService = inject(SaleService);
  private notify = inject(NotificationService);
  private dialog = inject(MatDialog);

  sale: SaleResponse;
  itemStates: ReturnItemState[] = [];
  refundMethod: PaymentMethod = 'EFECTIVO';
  reason = '';
  isSaving = false;

  readonly paymentMethods: { value: PaymentMethod; label: string; icon: string }[] = [
    { value: 'EFECTIVO',      label: 'Efectivo',      icon: 'payments'         },
    { value: 'TARJETA',       label: 'Tarjeta',        icon: 'credit_card'      },
    { value: 'TRANSFERENCIA', label: 'Transferencia',  icon: 'account_balance'  }
  ];

  constructor(
    @Inject(MAT_DIALOG_DATA) data: { sale: SaleResponse },
    private dialogRef: MatDialogRef<SaleReturnDialogComponent>
  ) {
    this.sale = data.sale;
  }

  ngOnInit(): void {
    this.buildItemStates();
  }

  // ── Build ─────────────────────────────────────────────────

  private buildItemStates(): void {
    // Calculamos cuánto ya fue devuelto de cada ítem sumando las devoluciones anteriores
    const returnedMap = new Map<number, number>();

    this.sale.items.forEach(item => {
      // Si hay devoluciones previas en la venta cargada las sumamos
      // (el backend es la fuente de verdad, aquí es solo para la UI)
      returnedMap.set(item.id, 0);
    });

    this.itemStates = this.sale.items.map(item => {
      const alreadyReturned = returnedMap.get(item.id) ?? 0;
      const available = item.quantity - alreadyReturned;
      return {
        saleItem: item,
        selected: false,
        quantityToReturn: available > 0 ? available : 0,
        alreadyReturned,
        availableToReturn: available,
        refundAmount: 0
      };
    });
  }

  // ── Interacción ───────────────────────────────────────────

  toggleItem(state: ReturnItemState): void {
    if (state.availableToReturn <= 0) return;
    state.selected = !state.selected;
    if (state.selected) {
      state.quantityToReturn = state.availableToReturn;
      this.recalculateRefund(state);
    } else {
      state.refundAmount = 0;
    }
  }

  onQuantityChange(state: ReturnItemState): void {
    if (!state.selected) return;
    if (state.quantityToReturn < 0.001) state.quantityToReturn = 0.001;
    if (state.quantityToReturn > state.availableToReturn) {
      state.quantityToReturn = state.availableToReturn;
    }
    this.recalculateRefund(state);
  }

  private recalculateRefund(state: ReturnItemState): void {
    const factor = 1 - (state.saleItem.discount || 0) / 100;
    state.refundAmount = Math.round(
      state.saleItem.unitPrice * state.quantityToReturn * factor * 100
    ) / 100;
  }

  // ── Getters ───────────────────────────────────────────────

  get selectedItems(): ReturnItemState[] {
    return this.itemStates.filter(s => s.selected);
  }

  get totalRefund(): number {
    return this.selectedItems.reduce((a, s) => a + s.refundAmount, 0);
  }

  get canSave(): boolean {
    return this.selectedItems.length > 0
      && !!this.refundMethod
      && !!this.reason.trim()
      && !this.isSaving;
  }

  // ── Guardar ───────────────────────────────────────────────

  save(): void {
    alert('Entrando  save');
    if (!this.canSave) return;

    const request: SaleReturnRequest = {
      refundMethod: this.refundMethod,
      reason: this.reason.trim(),
      items: this.selectedItems.map(s => ({
        saleItemId: s.saleItem.id,
        quantityToReturn: s.quantityToReturn
      }))
    };

    this.isSaving = true;
    this.saleService.createReturn(this.sale.id, request).subscribe({
      next: (res) => {
        const saleReturn: SaleReturnResponse = res.data;
        console.log('SaleReturn data:', saleReturn);
        console.log('Items:', saleReturn.items);
        this.isSaving = false;
        this.notify.success('¡Devolución registrada!', `Reembolso: $${this.totalRefund.toFixed(2)}`);
        this.dialogRef.close(saleReturn);
        this.dialogRef.afterClosed().subscribe(() => { // 🔍 DEBUG
          this.dialog.open(SaleReturnReceiptDialogComponent, {
            width: '420px',
            data: { saleReturn },
            panelClass: 'receipt-dialog'
          });
        });
      },
      error: (err) => {
        this.isSaving = false;
        this.notify.error('Error', err.error?.message || 'No se pudo registrar la devolución');
      }
    });
  }
}
