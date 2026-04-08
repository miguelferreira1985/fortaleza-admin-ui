import { Component, Inject, inject } from '@angular/core';
import { Client } from '../../../shared/models/client';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ClientService } from '../../../core/services/client.service';
import { NotificationService } from '../../../core/services/notification.service';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../../shared/material-module';

export interface ClientDialogData {
  client: Client | null;
}

@Component({
  selector: 'app-client-dialog.component',
  imports: [
    CommonModule,
    MaterialModule,
    ReactiveFormsModule
  ],
  templateUrl: './client-dialog.component.html',
  styleUrl: './client-dialog.component.scss',
})
export class ClientDialogComponent {

  private fb = inject(FormBuilder);
  private clientService = inject(ClientService);
  private notify = inject(NotificationService);

  clientForm!: FormGroup;
  isEditMode = false;
  isLoading = false;

  constructor(
    public dialogRef: MatDialogRef<ClientDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ClientDialogData
  ) {}

  ngOnInit(): void {
    this.initForm();
    if (this.data.client) {
      this.isEditMode = true;
      this.clientForm.patchValue({
        id:    this.data.client.id,
        name:  this.data.client.name,
        rfc:   this.data.client.rfc,
        phone: this.data.client.phone
      });
    }
  }

  initForm(): void {
    this.clientForm = this.fb.group({
      id:    [null],
      name:  ['', [Validators.required, Validators.maxLength(50)]],
      rfc:   ['', [Validators.required, Validators.maxLength(20)]],
      phone: ['', [Validators.maxLength(20)]]
    });
  }

  onSubmit(): void {
    if (this.clientForm.invalid) {
      this.clientForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const client: Client = this.clientForm.value;

    if (this.isEditMode && client.id) {
      this.clientService.updateClient(client.id, client).subscribe({
        next: (res) => {
          this.notify.success('¡Actualizado!', res?.message || 'Cliente actualizado');
          this.dialogRef.close(true);
        },
        error: (err) => {
          this.isLoading = false;
          this.notify.error('Error', err.error?.message || 'No se pudo actualizar');
        }
      });
    } else {
      this.clientService.createClient(client).subscribe({
        next: (res) => {
          this.notify.success('¡Creado!', res?.message || 'Cliente creado');
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
    const f = this.clientForm.get(field);
    return !!(f && f.invalid && (f.dirty || f.touched));
  }

  getErrorMessage(field: string): string {
    const f = this.clientForm.get(field);
    if (f?.hasError('required')) return 'Este campo es obligatorio';
    if (f?.hasError('maxlength')) return `Máximo ${f.errors?.['maxlength'].requiredLength} caracteres`;
    return '';
  }

}
