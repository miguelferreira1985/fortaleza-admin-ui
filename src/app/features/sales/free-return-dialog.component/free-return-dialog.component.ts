import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MaterialModule } from '../../../shared/material-module';
import { SaleService } from '../../../core/services/sale.service';
import { ProductService } from '../../../core/services/product.service';
import { NotificationService } from '../../../core/services/notification.service';
import { MatDialog } from '@angular/material/dialog';
import { Product } from '../../../shared/models/product';
import { PaymentMethod, FreeReturnRequest, SaleReturnResponse } from '../../../shared/models/sale.models';
import { SaleReturnReceiptDialogComponent } from '../sale-return-receipt-dialog.component/sale-return-receipt-dialog.component';

@Component({
  selector: 'app-free-return-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MaterialModule,
    MatDialogModule,
    CurrencyPipe
  ],
  templateUrl: './free-return-dialog.component.html',
  styleUrl: './free-return-dialog.component.scss'
})
export class FreeReturnDialogComponent implements OnInit {

  private saleService = inject(SaleService);
  private productService = inject(ProductService);
  private notify = inject(NotificationService);
  private dialog = inject(MatDialog);

  amount = 0;
  refundMethod: PaymentMethod = 'EFECTIVO';
  reason = '';
  isSaving = false;

  productSearch = '';
  allProducts: Product[] = [];
  filteredProducts: Product[] = [];
  selectedProduct: Product | null = null;
  quantityToRestore = 0;
  showProductDropdown = false;

  readonly paymentMethods: { value: PaymentMethod; label: string; icon: string }[] = [
    { value: 'EFECTIVO',      label: 'Efectivo',      icon: 'payments'        },
    { value: 'TARJETA',       label: 'Tarjeta',        icon: 'credit_card'     },
    { value: 'TRANSFERENCIA', label: 'Transferencia',  icon: 'account_balance' }
  ];

  constructor(
    private dialogRef: MatDialogRef<FreeReturnDialogComponent>
  ) {}

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.productService.getProducts(true).subscribe({
      next: (data) => { this.allProducts = data ?? []; }
    });
  }

  filterProducts(): void {
    const term = this.productSearch.toLowerCase().trim();
    if (!term) { this.filteredProducts = []; this.showProductDropdown = false; return; }
    this.filteredProducts = this.allProducts
      .filter(p => p.name.toLowerCase().includes(term) || p.code.toLowerCase().includes(term))
      .slice(0, 6);
    this.showProductDropdown = this.filteredProducts.length > 0;
  }

  selectProduct(product: Product): void {
    this.selectedProduct = product;
    this.productSearch = `${product.code} — ${product.name}`;
    this.showProductDropdown = false;
    this.quantityToRestore = 1;
  }

  clearProduct(): void {
    this.selectedProduct = null;
    this.productSearch = '';
    this.quantityToRestore = 0;
    this.showProductDropdown = false;
  }

  get canSave(): boolean {
    return this.amount > 0
      && !!this.refundMethod
      && !!this.reason.trim()
      && !this.isSaving;
  }

  save(): void {
    if (!this.canSave) return;

    const request: FreeReturnRequest = {
      amount: this.amount,
      refundMethod: this.refundMethod,
      reason: this.reason.trim(),
      productId: this.selectedProduct?.id ?? null,
      quantityToRestore: this.selectedProduct && this.quantityToRestore > 0
        ? this.quantityToRestore : null
    };

    this.isSaving = true;
    this.saleService.createFreeReturn(request).subscribe({
      next: (res) => {
        const saleReturn: SaleReturnResponse = res.data;
        this.isSaving = false;
        this.notify.success('¡Devolución registrada!', `Reembolso: $${this.amount.toFixed(2)}`);
        this.dialogRef.close(saleReturn);
        this.dialogRef.afterClosed().subscribe(() => {
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
