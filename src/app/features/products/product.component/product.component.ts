import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, inject, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from '../../../shared/material-module';
import { HasRoleDirective } from '../../../core/directives/has-role.directive';
import { ProductService } from '../../../core/services/product.service';
import { SupplierService } from '../../../core/services/supplier.service';
import { NotificationService } from '../../../core/services/notification.service';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { MatTableDataSource } from '@angular/material/table';
import { Product } from '../../../shared/models/product';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { Supplier } from '../../../shared/models/supplier';
import { StockDialogComponent } from '../stock-dialog.component/stock-dialog.component';

@Component({
  selector: 'app-product.component',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MaterialModule,
    HasRoleDirective
  ],
  templateUrl: './product.component.html',
  styleUrl: './product.component.scss',
})
export class ProductComponent implements OnInit, AfterViewInit {

  private productService = inject(ProductService);
  private supplierService = inject(SupplierService);
  private notify = inject(NotificationService);
  private dialog = inject(MatDialog);
  private router = inject(Router);

  dataSource = new MatTableDataSource<Product>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  searchTerm = '';
  isLoading = false;
  totalItems = 0;
  showActive = true;

  // Autocomplete de proveedor
  supplierControl = new FormControl<Supplier | string | null>(null);
  allSuppliers: Supplier[] = [];
  filteredSuppliers: Supplier[] = [];
  selectedSupplierId: number | null = null;

  displayedColumns: string[] = [
    'code', 'name', 'stock', 'price', 'cost',
    'presentation', 'category', 'actions'
  ];

  ngOnInit(): void {
    this.loadSuppliers();
    this.loadProducts();

    this.supplierControl.valueChanges.subscribe(val => {
      if (typeof val === 'string') {
        this.filteredSuppliers = this.filterSuppliers(val);
      } else if (val && typeof val === 'object') {
        this.filteredSuppliers = this.allSuppliers;
      } else {
        this.filteredSuppliers = this.allSuppliers;
      }
    });
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadSuppliers(): void {
    this.supplierService.getSuppliers(true).subscribe({
      next: (data) => {
        this.allSuppliers = data;
        this.filteredSuppliers = data;
      }
    });
  }

  loadProducts(): void {
    this.isLoading = true;

    const obs$ = this.selectedSupplierId
      ? this.supplierService.getProductsBySupplier(this.selectedSupplierId, this.showActive)
          .pipe()
      : null;

    if (this.selectedSupplierId) {
      this.supplierService.getProductsBySupplier(this.selectedSupplierId, this.showActive)
        .subscribe({
          next: (res: any) => this.setProducts(res.data ?? res),
          error: () => { this.isLoading = false; }
        });
    } else {
      this.productService.getProducts(this.showActive).subscribe({
        next: (data) => this.setProducts(data),
        error: () => { this.isLoading = false; }
      });
    }
  }

  onSupplierSelected(supplier: Supplier): void {
    this.selectedSupplierId = supplier.id ?? null;
    this.loadProducts();
  }

  clearSupplierFilter(): void {
    this.supplierControl.setValue(null);
    this.selectedSupplierId = null;
    this.loadProducts();
  }

  toggleFilter(): void {
    this.showActive = !this.showActive;
    this.loadProducts();
  }

  applyFilter(): void {
    this.dataSource.filter = this.searchTerm.trim().toLowerCase();
    if (this.dataSource.paginator) this.dataSource.paginator.firstPage();
  }

  goToCreate(): void {
    this.router.navigate(['/product/new']);
  }

  goToEdit(product: Product): void {
    this.router.navigate(['/product/edit', product.id]);
  }

  openStockDialog(product: Product): void {
    this.dialog.open(StockDialogComponent, {
      width: '500px',
      data: { product },
      disableClose: true
    }).afterClosed().subscribe(success => {
      if (success) this.loadProducts();
    });
  }

  activateProduct(product: Product): void {
    this.notify.confirm('¿Activar producto?', `¿Activas "${product.name}"?`)
      .then((confimed) => {
        if (confimed && product.id) {
          this.productService.activateProduct(product.id).subscribe({
            next: (res) => {
              this.notify.success('¡Activado!', res.message || 'El Producto fue activado');
              this.loadProducts();
            },
            error: err => this.notify.error('Error', err.error?.message)
          });
        }
      });
  }

  deactivateProduct(product: Product): void {
    this.notify.confirm('¿Desactivar producto?', `¿Desactivas "${product.name}"?`)
      .then((confimed) => {
        if (confimed && product.id) {
          this.productService.activateProduct(product.id).subscribe({
            next: (res) => {
              this.notify.success('Descativado!', res.message || 'El Producto fue desactivado');
              this.loadProducts();

          },
            error: err => this.notify.error('Error', err.error?.message)
          });
        }
      });
  }

  displaySupplier(s: Supplier | null): string {
    return s ? s.name : '';
  }

  trackById(index: number, item: Product): number {
    return item.id ?? index;
  }

  private setProducts(data: Product[]): void {
    this.dataSource.data = data ?? [];
    this.totalItems = data?.length ?? 0;
    this.dataSource.filterPredicate = (item: Product, filter: string) => {
      const s = filter.toLowerCase();
      return (
        item.name.toLowerCase().includes(s) ||
        item.code.toLowerCase().includes(s) ||
        (item.subcategory?.name?.toLowerCase().includes(s) ?? false)
      );
    };
    this.isLoading = false;
  }

  private filterSuppliers(val: string): Supplier[] {
    const s = val.toLowerCase();
    return this.allSuppliers.filter(sup => sup.name.toLowerCase().includes(s));
  }

}
