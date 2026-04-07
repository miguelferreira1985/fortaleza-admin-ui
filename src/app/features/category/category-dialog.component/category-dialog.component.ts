import { Component, Inject, inject } from '@angular/core';
import { Category } from '../../../shared/models/category';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CategoryService } from '../../../core/services/category.service';
import { NotificationService } from '../../../core/services/notification.service';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../../shared/material-module';

export interface CategoryDialogData {
  category: Category | null;
}

@Component({
  selector: 'app-category-dialog.component',
  imports: [
    CommonModule,
    MaterialModule,
    ReactiveFormsModule
  ],
  templateUrl: './category-dialog.component.html',
  styleUrl: './category-dialog.component.scss',
})
export class CategoryDialogComponent {

  private fb = inject(FormBuilder);
  private categoryService = inject(CategoryService);
  private notify = inject(NotificationService);

  categoryForm!: FormGroup;
  isEditMode: boolean = false;
  isLoading: boolean = false;

  constructor(
    public dialogRef: MatDialogRef<CategoryDialogComponent>, @Inject(MAT_DIALOG_DATA) public data: CategoryDialogData
  ) {}

  ngOnInit(): void {
    this.initializeForm();

    if (this.data.category) {
      this.isEditMode = true;
      this.loadCategoryData();
    }
  }

  initializeForm(): void {

    this.categoryForm = this.fb.group({
      id: [null],
      name: ['', [ Validators.required, Validators.maxLength(50) ]],
      description: ['', [ Validators.maxLength(200) ]]
    });

  }

  loadCategoryData(): void {
    if (this.data.category) {
      this.categoryForm.patchValue({
        id: this.data.category.id,
        name: this.data.category.name,
        description: this.data.category.description
      });
    }
  }

  onSubmit(): void {

    if (this.categoryForm.invalid) {
      this.categoryForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const category: Category = this.categoryForm.value;

    if (this.isEditMode && category.id) {
      this.updateCategory(category);
    } else {
      this.createCategory(category);
    }
  }

  createCategory(category: Category): void {
    this.categoryService.createCategory(category).subscribe({
      next: (res) => {
        this.notify.success('¡Creada!', res?.message || 'La categoria fue creada exitosamente');
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Error al crear:', err);
        this.notify.error('Error', err.error?.message || 'No se pudo crear la categoria');
      }
    })
  }

  updateCategory(category: Category): void {
    this.categoryService.updateCategory(category.id!, category).subscribe({
      next: (res) => {
        this.notify.success('¡Actualizada!', res?.message || 'La categoria fue actualizada exitosamente');
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Error al actualizar:', err);
        this.notify.error('Error', err.error?.message || 'No se pudo actualizar la categoria');
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  getErrorMessage(fieldName: string): string {
    const field = this.categoryForm.get(fieldName);

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
    const field = this.categoryForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

}
