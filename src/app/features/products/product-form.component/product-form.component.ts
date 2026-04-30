import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MaterialModule } from '../../../shared/material-module';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService } from '../../../core/services/product.service';
import { SupplierService } from '../../../core/services/supplier.service';
import { SubcategoryService } from '../../../core/services/subcategory.service';
import { PresentationService } from '../../../core/services/presentation.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Supplier } from '../../../shared/models/supplier';
import { Subcategory } from '../../../shared/models/subcategory';
import { Presentation } from '../../../shared/models/presentation';
import { Product } from '../../../shared/models/product';
import { CustomValidators } from '../../../shared/custom-validators';
import { debounceTime, distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'app-product-form.component',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MaterialModule,
    CurrencyPipe
  ],
  templateUrl: './product-form.component.html',
  styleUrl: './product-form.component.scss',
})
export class ProductFormComponent implements OnInit {

  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private productService = inject(ProductService);
  private supplierService = inject(SupplierService);
  private subcategoryService = inject(SubcategoryService);
  private presentationService = inject(PresentationService);
  private notify = inject(NotificationService);

  form!: FormGroup;
  isEditMode = false;
  isLoading = false;
  isSaving = false;
  productId: number | null = null;
  suppliersLoaded = false;

  suppliers: Supplier[] = [];
  subcategories: Subcategory[] = [];
  presentations: Presentation[] = [];

  private readonly IVA_RATE = 0.16;
  private updating = false;
  private costLockedToSuggested = true;
  private priceEditedByUser = false;

  profitPercentage = 0;
  costWithoutTaxes = 0;

  get isCreateMode(): boolean { return !this.form.get('id')?.value; }
  get supplierCosts(): FormArray { return this.form.get('supplierCosts') as FormArray; }
  c(name: string) { return this.form.get(name)!; }

  ngOnInit(): void {
    this.initForm();
    this.loadCatalogs();

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.productId = +id;
    }
  }

  initForm(): void {
    this.form = this.fb.group({
      id:              [null],
      name:            ['', [Validators.required, Validators.maxLength(100)]],
      code:            ['', [Validators.required, Validators.maxLength(50)]],
      description:     [''],
      price:           [0, [Validators.required, Validators.min(0)]],
      cost:            [0, [Validators.required, Validators.min(0)]],
      suggestedCost:   [{ value: 0, disabled: true }],
      stock:           [0, [Validators.required, Validators.min(0)]],
      minimumStock:    [0, [Validators.required, Validators.min(0)]],
      recommendedStock:[0, [Validators.min(0)]],
      subcategoryId:   [null],
      presentationId:  [null],
      supplierCosts:   this.fb.array([], this.uniqueSuppliersValidator)
    }, { validators: CustomValidators.priceGteCost });

    this.form.get('cost')?.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(() => { if (!this.updating) this.syncFromCostWithTaxes(); });

    this.form.get('price')?.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(() => { if (!this.updating) { this.priceEditedByUser = true; this.syncFromPrice(); } });

    this.supplierCosts.valueChanges.subscribe(() => this.calculateAverageCost());
  }

  loadCatalogs(): void {
    this.subcategoryService.getSubcategories().subscribe(d => this.subcategories = d);
    this.presentationService.getAllPresentations().subscribe(d => this.presentations = d);
    this.supplierService.getSuppliers().subscribe(data => {
      this.suppliers = (data || []).map(s => ({ ...s, id: Number(s.id) }));
      this.suppliersLoaded = true;

      if (this.isEditMode && this.productId) {
        this.loadProduct(this.productId);
      }
    });
  }

  loadProduct(id: number): void {
    this.isLoading = true;
    this.productService.getProductById(id).subscribe({
      next: (res: any) => {
        const product: Product = res.data ?? res;
        this.applyProduct(product);
        this.isLoading = false;
      },
      error: () => {
        this.notify.error('Error', 'No se pudo cargar el producto');
        this.isLoading = false;
        this.goBack();
      }
    });
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    this.isSaving = true;

    const suppliersForApi = this.supplierCosts.controls
      .map(g => ({
        supplierId: g.get('supplierId')?.value,
        supplierProductCode: g.get('supplierProductCode')?.value,
        cost: Number(g.get('supplierCostWithTaxes')?.value || 0),
        discount: Number(g.get('discount')?.value || 0)
      }))
      .filter(s => s.supplierId && s.cost > 0);

    const dto = { ...this.form.getRawValue(), supplierCosts: suppliersForApi };

    if (this.isEditMode && dto.id) {
      this.productService.updateProduct(dto.id, dto).subscribe({
        next: (res: any) => {
          this.notify.success('¡Actualizado!', res?.message);
          this.isSaving = false;
          this.goBack();
        },
        error: (err: any) => {
          this.isSaving = false;
          this.notify.error('Error', err.error?.message || 'No se pudo actualizar');
        }
      });
    } else {
      this.productService.createProduct(dto).subscribe({
        next: (res: any) => {
          this.notify.success('¡Creado!', res?.message);
          this.isSaving = false;
          this.goBack();
        },
        error: (err: any) => {
          this.isSaving = false;
          this.notify.error('Error', err.error?.message || 'No se pudo crear');
        }
      });
    }
  }

  goBack(): void { this.router.navigate(['/product']); }

  addSupplierRow(): void { this.supplierCosts.push(this.createSupplierRow()); }

  removeSupplierRow(i: number): void {
    this.supplierCosts.removeAt(i);
    this.calculateAverageCost();
  }

  onCostWithoutTaxesChange(event: Event): void {
    if (this.updating) return;
    this.updating = true;
    const value = parseFloat((event.target as HTMLInputElement).value) || 0;
    this.costWithoutTaxes = value;
    const costWithIva = this.round2(value * (1 + this.IVA_RATE));
    this.c('cost').setValue(costWithIva, { emitEvent: false });
    if (this.profitPercentage === 0) {
      this.c('price').setValue(costWithIva, { emitEvent: false });
    } else {
      this.c('price').setValue(this.round2(costWithIva * (1 + this.profitPercentage / 100)), { emitEvent: false });
    }
    this.calculateProfitPercentage();
    this.updating = false;
  }

  onProfitInput(event: Event): void {
    if (this.updating) return;

    this.updating = true;
    this.profitPercentage = Number((event.target as HTMLInputElement).value) || 0;

    const cost = Number(this.c('cost').value) || 0;
    if (cost > 0) {
      const newPrice = this.profitPercentage === 0
        ? cost
        : this.round2(cost * (1 + this.profitPercentage / 100));
        this.c('price').setValue(newPrice, { emitEvent: false });
    }
    this.updating = false;
  }

  onProfitBlur(): void {
    this.profitPercentage = this.round2(Number(this.profitPercentage) || 0);
  }

  private applyProduct(p: Product): void {
    this.updating = true;
    this.form.patchValue({
      id: p.id, name: p.name, code: p.code, description: p.description,
      price: p.price, cost: p.cost, stock: p.stock,
      minimumStock: p.minimumStock, recommendedStock: p.recommendedStock,
      subcategoryId: p.subcategory?.id, presentationId: p.presentation?.id
    }, { emitEvent: false });

    const raw = (p as any).supplierCosts;
    const list: any[] = Array.isArray(raw) ? raw : Object.values(raw ?? {});
    const rows = list.map((sc: any) => {
      const supplierId = Number(sc.supplierId ?? sc.supplier?.id ?? null);
      const withTaxes = Number(sc.cost) || 0;
      const withoutTaxes = withTaxes > 0 ? this.round2(withTaxes / (1 + this.IVA_RATE)) : 0;
      return this.createSupplierRow({ supplierId, supplierProductCode: sc.supplierProductCode, withTaxes, withoutTaxes, discount: Number(sc.discount) || 0 });
    });

    this.form.setControl('supplierCosts', this.fb.array(rows, this.uniqueSuppliersValidator));

    const cost = Number(p.cost) || 0;
    this.costWithoutTaxes = cost ? this.round2(cost / (1 + this.IVA_RATE)) : 0;
    this.profitPercentage = (p.price && p.cost) ? this.round2(((Number(p.price) - cost) / cost) * 100) : 0;
    this.costLockedToSuggested = false;
    this.priceEditedByUser = true;
    this.updating = false;
    this.calculateAverageCost();
  }

  private createSupplierRow(init?: any): FormGroup {
    const row = this.fb.group({
      supplierId:                [init?.supplierId ?? null],
      supplierProductCode:       [{ value: init?.supplierProductCode ?? '', disabled: !init?.supplierId }, Validators.required],
      supplierCostWithoutTaxes:  [{ value: init?.withoutTaxes ?? 0, disabled: !init?.supplierId }],
      supplierCostWithTaxes:     [{ value: init?.withTaxes ?? 0,   disabled: !init?.supplierId }],
      discount:                  [{ value: init?.discount ?? 0,    disabled: !init?.supplierId }]
    });

    let localUpdating = false;

    row.get('supplierCostWithoutTaxes')?.valueChanges.subscribe(v => {
      if (localUpdating) return; localUpdating = true;
      row.get('supplierCostWithTaxes')?.setValue(this.round2((Number(v)||0) * (1 + this.IVA_RATE)), { emitEvent: false });
      localUpdating = false; this.calculateAverageCost();
    });

    row.get('supplierCostWithTaxes')?.valueChanges.subscribe(v => {
      if (localUpdating) return; localUpdating = true;
      const val = Number(v) || 0;
      row.get('supplierCostWithoutTaxes')?.setValue(val > 0 ? this.round2(val / (1 + this.IVA_RATE)) : 0, { emitEvent: false });
      localUpdating = false; this.calculateAverageCost();
    });

    row.get('discount')?.valueChanges.subscribe(() => this.calculateAverageCost());

    const toggleRow = (enabled: boolean) => {
      const fields = ['supplierProductCode','supplierCostWithoutTaxes','supplierCostWithTaxes','discount'] as const;
      for (const f of fields) {
        enabled ? row.get(f)!.enable({ emitEvent: false }) : row.get(f)!.disable({ emitEvent: false });
      }
      const costCtrl = row.get('supplierCostWithTaxes')!;
      if (enabled) {
        costCtrl.setValidators([Validators.required, Validators.min(0.01)]);
      } else {
        costCtrl.clearValidators();
        ['supplierProductCode','supplierCostWithoutTaxes','supplierCostWithTaxes','discount']
          .forEach(f => row.get(f)?.setValue(f.includes('Code') ? '' : 0, { emitEvent: false }));
      }
      costCtrl.updateValueAndValidity({ emitEvent: false });
    };

    toggleRow(!!init?.supplierId);

    row.get('supplierId')?.valueChanges.subscribe(val => {
      const picked = Number(val || 0);
      if (picked > 0 && this.isDuplicateSupplierForRow(row, picked)) {
        row.get('supplierId')?.setValue(null, { emitEvent: false });
        toggleRow(false); return;
      }
      toggleRow(!!picked);
    });

    return row;
  }

  private isDuplicateSupplierForRow(row: AbstractControl, supplierId: number): boolean {
    return this.supplierCosts.controls.some(ctrl =>
      ctrl !== row && Number(ctrl.get('supplierId')?.value || 0) === supplierId
    );
  }

  private uniqueSuppliersValidator = (fa: AbstractControl): ValidationErrors | null => {
    const arr = fa as FormArray;
    const ids = arr.controls.map(c => c.get('supplierId')?.value).filter((v: any) => v != null);
    return new Set(ids).size !== ids.length ? { duplicateSuppliers: true } : null;
  }

  private syncFromCostWithTaxes(): void {
    const cost = Number(this.c('cost').value) || 0;
    this.costWithoutTaxes = cost > 0 ? this.round2(cost / (1 + this.IVA_RATE)) : 0;
    const newPrice = this.profitPercentage === 0 ? cost : this.round2(cost * (1 + this.profitPercentage / 100));
    this.c('price').setValue(newPrice, { emitEvent: false });
    this.calculateProfitPercentage();
  }

  private syncFromPrice(): void {
    const price = Number(this.c('price').value) || 0;
    const cost = Number(this.c('cost').value) || 0;
    if (cost > 0 && price > 0) this.profitPercentage = this.round2(((price - cost) / cost) * 100);
    else if (price === 0) this.profitPercentage = 0;
  }

  private calculateProfitPercentage(): void {
    const cost = Number(this.c('cost').value) || 0;
    const price = Number(this.c('price').value) || 0;
    if (cost > 0 && price > 0) this.profitPercentage = this.round2(((price - cost) / cost) * 100);
    else if (price === cost) this.profitPercentage = 0;
  }

  private calculateAverageCost(): void {
    if (this.updating) return;
    const rows = this.supplierCosts.controls.map(g => ({
      supplierId: g.get('supplierId')?.value,
      withTaxes: Number(g.get('supplierCostWithTaxes')?.value ?? 0),
      discount: Number(g.get('discount')?.value ?? 0)
    }));
    const effectiveCosts = rows
      .filter(r => r.supplierId && r.withTaxes > 0)
      .map(r => { const d = Math.max(0, r.discount); return r.withTaxes * (1 - d / 100); })
      .filter(v => v > 0);

    const suggested = effectiveCosts.length > 0
      ? this.round2(effectiveCosts.reduce((a, b) => a + b, 0) / effectiveCosts.length)
      : 0;

    this.updating = true;
    this.c('suggestedCost').setValue(suggested, { emitEvent: false });
    if (this.isCreateMode && this.costLockedToSuggested) {
      this.c('cost').setValue(suggested, { emitEvent: false });
      this.costWithoutTaxes = suggested > 0 ? this.round2(suggested / (1 + this.IVA_RATE)) : 0;
      if (!this.priceEditedByUser) this.c('price').setValue(suggested, { emitEvent: false });
      this.calculateProfitPercentage();
    }
    this.updating = false;
  }

  private round2(n: number): number {
    return Math.round((n + Number.EPSILON) * 100) / 100;
  }

}
