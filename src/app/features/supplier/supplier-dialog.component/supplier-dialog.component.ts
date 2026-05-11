import { Component, Inject, inject, OnInit } from '@angular/core';
import { Supplier } from '../../../shared/models/supplier';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../../shared/material-module';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SupplierService } from '../../../core/services/supplier.service';
import { NotificationService } from '../../../core/services/notification.service';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface SupplierDialogData {
  supplier: Supplier | null;
}

@Component({
  selector: 'app-supplier-dialog.component',
  imports: [
    CommonModule,
    MaterialModule,
    ReactiveFormsModule
  ],
  templateUrl: './supplier-dialog.component.html',
  styleUrl: './supplier-dialog.component.scss',
})
export class SupplierDialogComponent implements OnInit {

    private fb = inject(FormBuilder);
  private supplierService = inject(SupplierService);
  private notify = inject(NotificationService);

  supplierForm!: FormGroup;
  isEditMode = false;
  isLoading = false;

  constructor(
    public dialogRef: MatDialogRef<SupplierDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: SupplierDialogData
  ) {}

  ngOnInit(): void {
    this.initForm();
    if (this.data.supplier) {
      this.isEditMode = true;
      this.supplierForm.patchValue({
        id:           this.data.supplier.id,
        name:         this.data.supplier.name,
        contact:      this.data.supplier.contact,
        contactPhone: this.data.supplier.contactPhone,
        officePhone:  this.data.supplier.officePhone,
        email:        this.data.supplier.email,
        location:     this.data.supplier.location
      });
    }
  }

  initForm(): void {
    this.supplierForm = this.fb.group({
      id:           [null],
      name:         ['', [Validators.required, Validators.maxLength(50)]],
      contact:      ['', [Validators.required, Validators.maxLength(50)]],
      contactPhone: ['', [Validators.required, Validators.pattern(/\+?[0-9]{10,15}/)]],
      officePhone:  ['', [Validators.pattern(/\+?[0-9]{10,15}/)]],
      email:        ['', [Validators.email]],
      location:     ['', [Validators.required, Validators.maxLength(20)]]
    });
  }

  onSubmit(): void {
    if (this.supplierForm.invalid) {
      this.supplierForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const supplier: Supplier = this.supplierForm.value;

    if (this.isEditMode && supplier.id) {
      this.supplierService.updateSupplier(supplier.id, supplier).subscribe({
        next: (res) => {
          this.notify.success('¡Actualizado!', res?.message || 'Proveedor actualizado');
          this.dialogRef.close(true);
        },
        error: (err) => {
          this.isLoading = false;
          this.notify.error('Error', err.error?.message || 'No se pudo actualizar');
        }
      });
    } else {
      this.supplierService.createSupplier(supplier).subscribe({
        next: (res) => {
          this.notify.success('¡Creado!', res?.message || 'Proveedor creado');
          this.dialogRef.close(true);
        },
        error: (err) => {
          this.isLoading = false;
          this.notify.error('Error', err.error?.message || 'No se pudo crear');
        }
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  hasError(field: string): boolean {
    const f = this.supplierForm.get(field);
    return !!(f && f.invalid && (f.dirty || f.touched));
  }

  getErrorMessage(field: string): string {
    const f = this.supplierForm.get(field);
    if (f?.hasError('required'))  return 'Este campo es obligatorio';
    if (f?.hasError('email'))     return 'Formato de email inválido';
    if (f?.hasError('pattern'))   return 'Formato de teléfono inválido (10-15 dígitos)';
    if (f?.hasError('maxlength')) return `Máximo ${f.errors?.['maxlength'].requiredLength} caracteres`;
    return '';
  }

}
