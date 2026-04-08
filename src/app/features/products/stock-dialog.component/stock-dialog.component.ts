import { CommonModule } from '@angular/common';
import { Component, Inject, inject, OnInit } from '@angular/core';
import { MaterialModule } from '../../../shared/material-module';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProductService } from '../../../core/services/product.service';
import { NotificationService } from '../../../core/services/notification.service';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Product } from '../../../shared/models/product';
import { CustomValidators } from '../../../shared/custom-validators';

export interface StockDialogData { product: Product; }

@Component({
  selector: 'app-stock-dialog.component',
  imports: [
    CommonModule,
    MaterialModule,
    ReactiveFormsModule
  ],
  templateUrl: './stock-dialog.component.html',
  styleUrl: './stock-dialog.component.scss',
})
export class StockDialogComponent implements OnInit {

  private fb = inject(FormBuilder);
  private productService = inject(ProductService);
  private notify = inject(NotificationService);

  form!: FormGroup;
  isLoading = false;

  constructor(
    public dialogRef: MatDialogRef<StockDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: StockDialogData
  ) {}

  ngOnInit(): void {
    const prev = Number(this.data.product.stock ?? 0);

    this.form = this.fb.group({
      previousStock: [{ value: prev, disabled: true }],
      quantity:      [0, [Validators.required, CustomValidators.nonZeroQuantity]],
      newStock:      [{ value: prev, disabled: true }],
      description:   ['', Validators.required]
    }, { validators: CustomValidators.nonNegativeStock });

    this.form.get('quantity')?.valueChanges.subscribe(qty => {
      const q = Number(qty ?? 0);
      this.form.get('newStock')?.setValue(prev + q, { emitEvent: false });
      this.form.updateValueAndValidity({ onlySelf: true, emitEvent: false });
    });
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    this.isLoading = true;
    const { id } = this.data.product;
    const dto = {
      quantity: Number(this.form.get('quantity')?.value),
      description: this.form.get('description')?.value
    };

    this.productService.updateStock(id!, dto).subscribe({
      next: (res: any) => {
        this.notify.success('¡Stock actualizado!', res?.message);
        this.dialogRef.close(true);
      },
      error: (err: any) => {
        this.isLoading = false;
        this.notify.error('Error', err.error?.message || 'No se pudo actualizar');
      }
    });
  }

  onCancel(): void { this.dialogRef.close(false); }

  get newStockValue(): number {
    return Number(this.form.get('newStock')?.value ?? 0);
  }

}
