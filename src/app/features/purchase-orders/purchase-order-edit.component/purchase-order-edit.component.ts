import { CommonModule } from '@angular/common';
import { Component, inject, Inject, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MaterialModule } from '../../../shared/material-module';
import { ActivatedRoute, Router } from '@angular/router';
import { PurchaseOrderService } from '../../../core/services/purchase-order.service';
import { NotificationService } from '../../../core/services/notification.service';
import { getStatusConfig } from '../../../core/utils/purchase-order-status.util';

@Component({
  selector: 'app-purchase-order-edit.component',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MaterialModule
  ],
  templateUrl: './purchase-order-edit.component.html',
  styleUrl: './purchase-order-edit.component.scss',
})
export class PurchaseOrderEditComponent implements OnInit {

  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private purchaseOrderService = inject(PurchaseOrderService);
  private notify = inject(NotificationService);

  order: any = null;
  isLoading = false;
  isSaving = false;
  orderId!: number;
  today = new Date();

  readonly IVA_RATE = 0.16;
  readonly getStatusConfig = getStatusConfig;

  form!: FormGroup;

  get itemsArray(): FormArray {
    return this.form.get('items') as FormArray;
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (!id || isNaN(+id)) {
      this.goBack();
      return;
    }

    this.orderId = +id;

    this.form = this.fb.group({
      items: this.fb.array([])
    });

    this.loadOrder();
  }

  loadOrder(): void {
    this.isLoading = true;

    this.purchaseOrderService.getById(this.orderId).subscribe({
      next: res => {
        this.order = res.data ?? res;

        if (this.order.status !== 'PENDIENTE') {
          this.notify.error('No permitido', 'Solo se pueden editar órdenes en estado PENDIENTE');
          this.goBack();
          return;
        }

        this.populateForm();
        this.isLoading = false;
      },
      error: err => {
        this.notify.error('Errror', err.error?.message || 'Nos se pudo cargar la orden');
        this.isLoading = false;
        this.goBack();
      }
    });
  }

  populateForm(): void {
    this.itemsArray.clear();
    (this.order.items ?? []).forEach((item: any) => {
      this.itemsArray.push(this.buildItemGroup(item));
    });
  }

  buildItemGroup(item: any): FormGroup {
    const withTaxes = Number(item.unitCostWithTaxes || 0);
    const withoutTaxes = withTaxes > 0 ? this.round2(withTaxes / (1 + this.IVA_RATE)) : 0;

    const group = this.fb.group({
      itemId: [item.id],
      productId: [item.productId ?? item.product?.id],
      productName: [item.productName ?? item.product?.name],
      supplierProductCode: [item.supplierProductCode],
      quantityOrdered: [Number(item.quantityOrdered), [Validators.required, Validators.min(0.01)]],
      quantityReceived: [Number(item.quantityReceived || 0)],
      unitCostWithoutTaxes: [withoutTaxes],
      unitCostWithTaxes: [withTaxes, [Validators.required, Validators.min(0.01)]],
      subtotalWithoutTaxes: [{ value: 0, disabled: true }],
      subtotalWithTaxes: [{ value: 0, disabled: true }]
    });

    this.recalcItem(group);

    let localUpdating = false;

    group.get('unitCostWithoutTaxes')?.valueChanges.subscribe(v => {
      if (localUpdating) return;
      localUpdating = true;

      const val = Number(v) || 0;

      group.get('unitCostWithTaxes')?.setValue(this.round2(val * (1 + this.IVA_RATE)), { emitEvent: false });
      localUpdating = false;
      this.recalcItem(group);
      this.recalcTotals();
    });

    group.get('unitCostWithTaxes')?.valueChanges.subscribe(v => {
      if (localUpdating) return; localUpdating = true;
      const val = Number(v) || 0;
      group.get('unitCostWithoutTaxes')?.setValue(val > 0 ? this.round2(val / (1 + this.IVA_RATE)) : 0, { emitEvent: false });
      localUpdating = false;
      this.recalcItem(group);
      this.recalcTotals();
    });

    group.get('quantityOrdered')?.valueChanges.subscribe(() => {
      this.recalcItem(group);
      this.recalcTotals();
    });

    return group;
  }

  removeItem(index: number): void {
    const item = this.itemsArray.at(index);
    const received = Number(item.get('quantityReceived')?.value || 0);

    if (received > 0) {
      this.notify.error('No permitido', 'No puedes eliminar un producto con unidades ya recibidas');
      return;
    }

    if (this.itemsArray.length === 1) {
      this.notify.error('No permitido', 'La orden debe tener al menos un producto');
      return;
    }

    this.itemsArray.removeAt(index);
    this.recalcTotals();
  }

  get totalWithTaxes(): number {
    return this.itemsArray.controls.reduce((acc, ctrl) => {
      return acc + (Number(ctrl.get('subtotalWithTaxes')?.value) || 0);
    }, 0);
  }

  get totalWithoutTaxes(): number {
    return this.itemsArray.controls.reduce((acc, ctrl) => {
      return acc + (Number(ctrl.get('subtotalWithoutTaxes')?.value) || 0);
    }, 0);
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    this.isSaving = true;

    const dto = {
      items: this.itemsArray.controls.map(ctrl => ({
        id:                   ctrl.get('itemId')?.value,
        productId:            ctrl.get('productId')?.value,
        quantityOrdered:      Number(ctrl.get('quantityOrdered')?.value),
        unitCostWithTaxes:    Number(ctrl.get('unitCostWithTaxes')?.value),
        unitCostWithoutTaxes: Number(ctrl.get('unitCostWithoutTaxes')?.value),
      }))
    };

    this.purchaseOrderService.updateOldOrder(this.orderId, dto).subscribe({
      next: res => {
        this.notify.success('¡Orden actualizada!', `Orden #${this.orderId} actualizada correctamente`);
        this.isSaving = false;
        this.router.navigate(['/purchase-orders', this.orderId]);
      },
      error: err => {
        this.notify.error('Error', err.error?.message || 'No se pudo actualizar');
        this.isSaving = false;
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/purchase-orders', this.orderId]);
  }

  private recalcItem(group: FormGroup): void {
    const qty      = Number(group.get('quantityOrdered')?.value) || 0;
    const withTax  = Number(group.get('unitCostWithTaxes')?.value) || 0;
    const noTax    = Number(group.get('unitCostWithoutTaxes')?.value) || 0;

    group.get('subtotalWithTaxes')?.setValue(this.round2(qty * withTax), { emitEvent: false });
    group.get('subtotalWithoutTaxes')?.setValue(this.round2(qty * noTax),  { emitEvent: false });
  }

  private recalcTotals(): void {
    // Los totals son getters computados, Angular los recalcula al detectar cambios
  }

  private round2(n: number): number {
    return Math.round((n + Number.EPSILON) * 100) / 100;
  }

}
