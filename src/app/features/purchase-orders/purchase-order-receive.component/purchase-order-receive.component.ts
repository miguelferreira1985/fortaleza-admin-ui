import { CommonModule, Location } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MaterialModule } from '../../../shared/material-module';
import { ActivatedRoute, Router } from '@angular/router';
import { PurchaseOrderService } from '../../../core/services/purchase-order.service';
import { NotificationService } from '../../../core/services/notification.service';
import { getStatusConfig } from '../../../core/utils/purchase-order-status.util';
import { PurchaseOrderStatusUpdateRequestDTO } from '../../../shared/models/purchase-order.models';
import { PurchaseOrderStatus } from '../../../shared/models/purchase-order-status.enum';

@Component({
  selector: 'app-purchase-order-receive.component',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MaterialModule
  ],
  templateUrl: './purchase-order-receive.component.html',
  styleUrl: './purchase-order-receive.component.scss',
})
export class PurchaseOrderReceiveComponent implements OnInit {

  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);
  private purchaseOrderService = inject(PurchaseOrderService);
  private notify = inject(NotificationService);

  orderId!: number;
  order: any = null;
  receiveForm!: FormGroup;
  isLoading = false;
  isSaving = false;
  errorMessage = '';

  readonly getStatusConfig = getStatusConfig;

  ngOnInit(): void {
    this.receiveForm = this.fb.group({
      description: [''],
      items: this.fb.array([])
    });

    const idParam = this.route.snapshot.paramMap.get('id');
    if (!idParam || isNaN(+idParam)) { this.errorMessage = 'ID de orden inválido'; return; }
    this.orderId = +idParam;
    this.loadOrder();
  }

  get itemsArray(): FormArray {
    return this.receiveForm.get('items') as FormArray;
  }

  loadOrder(): void {
    this.isLoading = true;
    this.purchaseOrderService.getById(this.orderId).subscribe({
      next: res => {
        this.order = res.data ?? res;
        this.isLoading = false;
        if (!this.canReceiveOrder(this.order.status)) {
          this.errorMessage = `La orden no se puede recibir en estado ${this.order.status}`;
          return;
        }
        this.buildReceiveForm();
      },
      error: err => {
        this.errorMessage = err?.error?.message || 'No se pudo cargar la orden';
        this.notify.error('Error', this.errorMessage);
        this.isLoading = false;
      }
    });
  }

  canReceiveOrder(status: string): boolean {
    return ['PENDIENTE', 'PARCIALMENTE_RECIBIDA'].includes(status);
  }

  buildReceiveForm(): void {
    this.itemsArray.clear();
    (this.order?.items ?? []).forEach((item: any) => {
      const ordered  = Number(item.quantityOrdered || 0);
      const received = Number(item.quantityReceived || 0);
      const pending  = +(ordered - received).toFixed(2);
      if (pending > 0) {
        this.itemsArray.push(this.fb.group({
          itemId:           [item.id, Validators.required],
          productName:      [item.productName ?? ''],
          quantityOrdered:  [ordered],
          quantityReceived: [received],
          pending:          [pending],
          quantityToReceive:[null, [Validators.min(0.01)]]
        }));
      }
    });

    if (this.itemsArray.length === 0) {
      this.errorMessage = 'La orden no tiene productos pendientes por recibir';
    }
  }

  getPending(ctrl: AbstractControl): number {
    return Number(ctrl.get('pending')?.value || 0);
  }

  showQtyError(ctrl: AbstractControl): boolean {
    const qtyCtrl = ctrl.get('quantityToReceive');
    if (!qtyCtrl?.touched && !qtyCtrl?.dirty) return false;
    const qty = Number(qtyCtrl.value);
    const pending = Number(ctrl.get('pending')?.value || 0);
    return qty !== null && (qty <= 0 || qty > pending);
  }

  saveReception(): void {
    if (!this.order?.id || this.isSaving) return;

    const selectedItems = this.itemsArray.controls
      .map(ctrl => ({
        itemId: ctrl.get('itemId')?.value,
        pending: Number(ctrl.get('pending')?.value || 0),
        quantityToReceive: Number(ctrl.get('quantityToReceive')?.value || 0)
      }))
      .filter(i => i.quantityToReceive > 0);

    if (!selectedItems.length) {
      this.notify.error('Error', 'Captura al menos una cantidad a recibir');
      return;
    }

    if (selectedItems.some(i => i.quantityToReceive <= 0 || i.quantityToReceive > i.pending)) {
      this.notify.error('Error', 'Una o más cantidades son inválidas');
      return;
    }

    this.isSaving = true;
    const request: PurchaseOrderStatusUpdateRequestDTO = {
      newStatus: PurchaseOrderStatus.COMPLETADA,
      description: this.receiveForm.get('description')?.value || null,
      items: selectedItems.map(i => ({ itemId: i.itemId, quantityToReceive: i.quantityToReceive }))
    };

    this.purchaseOrderService.updateStatus(this.orderId, request).subscribe({
      next: res => {
        const updated = res.data ?? res;
        this.isSaving = false;
        this.notify.success('¡Recepción guardada!', `Orden #${this.orderId} actualizada`);
        this.router.navigate(['/purchase-orders', updated.id]);
      },
      error: err => {
        this.errorMessage = err?.error?.message || 'No se pudo guardar la recepción';
        this.isSaving = false;
      }
    });
  }

  goToDetail(): void { this.router.navigate(['/purchase-orders', this.orderId]); }
  cancel(): void     { this.location.back(); }

}
