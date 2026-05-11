import { CommonModule } from '@angular/common';
import { Component, Inject, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MaterialModule } from '../../../shared/material-module';
import { PresentationService } from '../../../core/services/presentation.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Presentation } from '../../../shared/models/presentation';

export interface PresentationDialogData {
  presentation: Presentation | null;
}

@Component({
  selector: 'app-presentation-dialog.component',
  imports: [
    CommonModule,
    MaterialModule,
    ReactiveFormsModule
  ],
  templateUrl: './presentation-dialog.component.html',
  styleUrl: './presentation-dialog.component.scss',
})
export class PresentationDialogComponent implements OnInit {

  private fb = inject(FormBuilder);
  private presentationService = inject(PresentationService);
  private notify = inject(NotificationService);

  presentationForm!: FormGroup;
  isEditMode: boolean = false;
  isLoading: boolean = false;

  constructor(
    public dialogRef: MatDialogRef<PresentationDialogComponent>, @Inject(MAT_DIALOG_DATA) public data: PresentationDialogData
  ) {}

  ngOnInit(): void {
    this.initializeForm();

    if (this.data.presentation) {
      this.isEditMode = true;
      this.loadPresentationData();
    }
  }

  initializeForm(): void {

    this.presentationForm = this.fb.group({
      id: [null],
      name: ['', [ Validators.required, Validators.maxLength(50) ]],
      abbreviation: ['', [ Validators.required, Validators.maxLength(10) ]]
    });

  }

  loadPresentationData(): void {
    if (this.data.presentation) {
      this.presentationForm.patchValue({
        id: this.data.presentation.id,
        name: this.data.presentation.name,
        abbreviation: this.data.presentation.abbreviation
      });
    }
  }

  onSubmit(): void {

    if (this.presentationForm.invalid) {
      this.presentationForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const presentation: Presentation = this.presentationForm.value;

    if (this.isEditMode && presentation.id) {
      this.updatePresentation(presentation);
    } else {
      this.createPresentation(presentation);
    }
  }

  createPresentation(presentation: Presentation): void {
    this.presentationService.createPresentation(presentation).subscribe({
      next: (res) => {
        this.notify.success('¡Creada!', res?.message || 'La presentación fue creada exitosamente');
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Error al crear:', err);
        this.notify.error('Error', err.error?.message || 'No se pudo crear la presentación');
      }
    })
  }

  updatePresentation(presentation: Presentation): void {
    this.presentationService.updatePresentation(presentation.id!, presentation).subscribe({
      next: (res) => {
        this.notify.success('¡Actualizada!', res?.message || 'La presentación fue actualizada exitosamente');
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Error al actualizar:', err);
        this.notify.error('Error', err.error?.message || 'No se pudo actualizar la presentación');
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  getErrorMessage(fieldName: string): string {
    const field = this.presentationForm.get(fieldName);

    if (field?.hasError('required')) {
      return 'Este campo es obligatorio';
    }

    if (field?.hasError('maxLength')) {
      const maxLength = field.errors?.['maxLength'].requiredLength;
      return `Máximo ${maxLength} caracteres`;
    }

    return '';

  }

  hasError(fieldName: string): boolean {
    const field = this.presentationForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

}
