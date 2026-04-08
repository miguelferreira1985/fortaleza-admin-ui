import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { MaterialModule } from '../../../shared/material-module';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PurchaseOrderService } from '../../../core/services/purchase-order.service';
import { SupplierService } from '../../../core/services/supplier.service';
import { NotificationService } from '../../../core/services/notification.service';
import { PurchaseOrderStatus } from '../../../shared/models/purchase-order-status.enum';
import { getStatusConfig } from '../../../core/utils/purchase-order-status.util';
import { PurchaseOrder, PurchaseOrderItemRequest, PurchaseOrderRequest } from '../../../shared/models/purchase-order.models';
import { Product } from '../../../shared/models/product';

@Component({
  selector: 'app-supplier-purchase-order.component',
  imports: [
    CommonModule,
    MaterialModule,
    ReactiveFormsModule,
    RouterLink
  ],
  templateUrl: './supplier-purchase-order.component.html',
  styleUrl: './supplier-purchase-order.component.scss',
})
export class SupplierPurchaseOrderComponent implements OnInit {

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private purchaseOrderService = inject(PurchaseOrderService);
  private supplierService = inject(SupplierService);
  private notify = inject(NotificationService);

  readonly statusEnum = PurchaseOrderStatus;
  readonly getStatusConfig = getStatusConfig;

  supplierId!: number;
  supplierName?: string;
  isSaving = false;

  orders: PurchaseOrder[] = [];
  products: Product[] = [];
  draftItems: { product: Product; quantity: number }[] = [];

  orderForm!: FormGroup;

  // Columnas de la tabla de historial
  displayedColumns = ['id', 'createdDateTime', 'expectedDeliveryDate', 'status', 'totalWithTaxes', 'actions'];

  ngOnInit(): void {
    this.supplierId = Number(this.route.snapshot.paramMap.get('supplierId'));
    this.initForm();
    this.loadSupplierInfo();
    this.loadOrders();
    this.loadProducts();
  }

  loadSupplierInfo(): void {
    this.supplierService.getSupplierById(this.supplierId).subscribe({
      next: (res: any) => {
        this.supplierName = (res.data ?? res).name;
      }
    });
  }

  loadOrders(): void {
    this.purchaseOrderService.getBySupplier(this.supplierId).subscribe({
          next: res => {
            this.orders = (res.data ?? res).sort((a: PurchaseOrder, b: PurchaseOrder) => this.sortByStatus(a, b));
    },
      error: err => console.error(err)
    });
  }

  loadProducts(): void {
    this.supplierService.getProductsBySupplier(this.supplierId, true).subscribe({
      next: res => this.products = (res.data ?? res),
      error: err => console.error(err)
    });
  }

  get draftTotalQuantity(): number {
    return this.draftItems.reduce((acc, i) => acc + i.quantity, 0);
  }

  get canAddItem(): boolean {
    return this.orderForm.get('productId')?.valid === true
        && this.orderForm.get('quantity')?.valid === true;
  }

  addItem(): void {
    if (!this.canAddItem) return;

    const productId = this.orderForm.get('productId')?.value;
    const quantity  = Number(this.orderForm.get('quantity')?.value);
    const product   = this.products.find(p => p.id === productId);

    if (!product || quantity <= 0) return;

    const existing = this.draftItems.find(i => i.product.id === product.id);
    if (existing) {
      existing.quantity += quantity;
    } else {
      this.draftItems.push({ product, quantity });
    }

    this.orderForm.patchValue({ productId: null, quantity: null });
    this.orderForm.get('productId')?.markAsPristine();
    this.orderForm.get('productId')?.markAsUntouched();
    this.orderForm.get('quantity')?.markAsPristine();
    this.orderForm.get('quantity')?.markAsUntouched();
  }

  removeDraftItem(productId: number): void {
    this.draftItems = this.draftItems.filter(i => i.product.id !== productId);
  }

  createOrder(): void {
    if (!this.draftItems.length) return;

    this.isSaving = true;
    const items: PurchaseOrderItemRequest[] = this.draftItems.map(i => ({
      productId: i.product.id!,
      quantityOrdered: i.quantity
    }));

    const rawDate = this.orderForm.get('expectedDeliveryDate')?.value;
    const request: PurchaseOrderRequest = {
      supplierId: this.supplierId,
      expectedDeliveryDate: rawDate ? (rawDate instanceof Date ? rawDate.toISOString() : new Date(rawDate).toISOString()) : undefined,
      items
    };

    this.purchaseOrderService.createOrder(request).subscribe({
      next: res => {
        const order = res.data ?? res;
        this.orders = [order, ...this.orders].sort((a,b) => this.sortByStatus(a, b));
        this.draftItems = [];
        this.orderForm.reset();
        this.isSaving = false;
        this.notify.success('¡Orden creada!', `Orden #${order.id} creada exitosamente`);
      },
      error: err => {
        this.notify.error('Error', err.error?.message || 'No se pudo crear la orden');
        this.isSaving = false;
      }
    });
  }

  getSelectedProduct(): Product | undefined {
    const id = this.orderForm.get('productId')?.value;
    return this.products.find(p => p.id === id);
  }

  viewDetails(order: PurchaseOrder): void {
    this.router.navigate(['/purchase-orders', order.id]);
  }

  goBack(): void {
    this.router.navigate(['/supplier']);
  }

  private initForm(): void {
    this.orderForm = this.fb.group({
      expectedDeliveryDate: [null],
      productId: [null, Validators.required],
      quantity:  [null, [Validators.required, Validators.min(0.01)]]
    });
  }

  private sortByStatus(a: PurchaseOrder, b: PurchaseOrder): number {
    const priority: Record<string, number> = {
      'PENDIENTE':             0,
      'PARCIALMENTE_RECIBIDA': 1,
      'COMPLETADA':            2,
      'CANCELADA':             3
    };

    const pa = priority[a.status] ?? 99;
    const pb = priority[b.status] ?? 99;

    if (pa !== pb) return pa - pb;

    return (b.id ?? 0) - (a.id ?? 0);
  }

}
