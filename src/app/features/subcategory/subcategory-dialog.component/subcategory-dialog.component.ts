import { CommonModule } from '@angular/common';
import { Component, Inject, inject } from '@angular/core';
import { MaterialModule } from '../../../shared/material-module';
import { Form, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subcategory } from '../../../shared/models/subcategory';
import { SubcategoryService } from '../../../core/services/subcategory.service';
import { CategoryService } from '../../../core/services/category.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Category } from '../../../shared/models/category';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { SubcategoryRequestDto } from '../../../shared/models/subcategory-request-dto';

export interface SubcategoryDialogData {
  subcategory: Subcategory | null;
}

@Component({
  selector: 'app-subcategory-dialog.component',
  imports: [
    CommonModule,
    MaterialModule,
    ReactiveFormsModule
  ],
  templateUrl: './subcategory-dialog.component.html',
  styleUrl: './subcategory-dialog.component.scss',
})
export class SubcategoryDialogComponent {

  private fb = inject(FormBuilder);
  private subcategoryService = inject(SubcategoryService);
  private categoryService = inject(CategoryService);
  private notify = inject(NotificationService);

  subcategoryForm!: FormGroup;
  isEditMode = false;
  isLoading = false;

  allCategories: Category[] = [];
  filteredCategories: Category[] = [];

  constructor(
    public dialogRef: MatDialogRef<SubcategoryDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: SubcategoryDialogData
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadCategories();

    if (this.data.subcategory) {
      this.isEditMode = true;
      this.loadSubcategoryData();
    }
  }

  initForm(): void {
    this.subcategoryForm = this.fb.group({
      id:          [null],
      name:        ['', [Validators.required, Validators.maxLength(50)]],
      description: ['', [Validators.maxLength(200)]],
      categoryObj: [null],
      categoryId:  [null]
    });

    this.subcategoryForm.get('categoryObj')?.valueChanges.subscribe(val => {
      if (typeof val === 'string') {
        this.filteredCategories = this.filterCategories(val);
      } else if (val && typeof val === 'object') {
        this.subcategoryForm.patchValue({ categoryId: val.id }, { emitEvent: false });
        this.filteredCategories = this.allCategories;
      } else {
        this.subcategoryForm.patchValue({ categoryId: null }, { emitEvent: false });
        this.filteredCategories = this.allCategories;
      }
    });
  }

  loadCategories(): void {
    this.categoryService.getAllCategories().subscribe(data => {
      this.allCategories = data;
      this.filteredCategories = data;
    });
  }

  loadSubcategoryData(): void {
    const s = this.data.subcategory!;
    this.subcategoryForm.patchValue({
      id:          s.id,
      name:        s.name,
      description: s.description,
      categoryObj: s.category ?? null,
      categoryId:  s.category?.id ?? null
    });
  }

  displayCategory(category: Category | null): string {
    return category ? category.name : '';
  }

  private filterCategories(value: string): Category[] {
    const search = value.toLowerCase();
    return this.allCategories.filter(c => c.name.toLowerCase().includes(search));
  }

  onSubmit(): void {
    if (this.subcategoryForm.invalid) {
      this.subcategoryForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;

    const request: SubcategoryRequestDto = this.subcategoryForm.value;

    if (this.isEditMode && request.id) {
      this.subcategoryService.updateSubcategory(request.id, request).subscribe({
        next: (res) => {
          this.notify.success('¡Actualizada!', res?.message || 'Subcategoría actualizada');
          this.dialogRef.close(true);
        },
        error: (err) => {
          this.isLoading = false;
          this.notify.error('Error', err.error?.message || 'No se pudo actualizar');
        }
      });
    } else {
      this.subcategoryService.createSubcategory(request).subscribe({
        next: (res) => {
          this.notify.success('¡Creada!', res?.message || 'Subcategoría creada');
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
    const f = this.subcategoryForm.get(field);
    return !!(f && f.invalid && (f.dirty || f.touched));
  }

  getErrorMessage(field: string): string {
    const f = this.subcategoryForm.get(field);
    if (f?.hasError('required')) return 'Este campo es obligatorio';
    if (f?.hasError('maxlength')) return `Máximo ${f.errors?.['maxlength'].requiredLength} caracteres`;
    return '';
  }

}
