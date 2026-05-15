import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MaterialModule } from '../../shared/material-module';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ProductService } from '../../core/services/product.service';
import { InventoryMovementService } from '../../core/services/inventory-movement.service';
import { MatTableDataSource } from '@angular/material/table';
import { InventoryMovement } from '../../shared/models/inventory-movement';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { Product } from '../../shared/models/product';
import { debounceTime, distinctUntilChanged, startWith, Subscription } from 'rxjs';
import { BreakpointObserver } from '@angular/cdk/layout';

@Component({
  selector: 'app-inventory-movement.component',
  imports: [
    CommonModule,
    MaterialModule,
    FormsModule,
    ReactiveFormsModule
  ],
  templateUrl: './inventory-movement.component.html',
  styleUrl: './inventory-movement.component.scss',
})
export class InventoryMovementComponent implements OnInit, AfterViewInit, OnDestroy {

  private productService = inject(ProductService);
  private inventoryMovementService = inject(InventoryMovementService);
  private breakpoint = inject(BreakpointObserver);

  private subs = new Subscription();

  dataSource = new MatTableDataSource<InventoryMovement>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  productControl = new FormControl('');
  movementTypeControl = new FormControl('');
  products: Product[] = [];
  filteredProducts: Product[] = [];
  selectedProductId: number | null = null;

  searchTerm = '';
  isLoading = false;

  movementTypeOptions = [
    { value: 'ALL', label: 'Todos los tipos' },
    { value: 'COMPRA', label: 'Compra' },
    { value: 'VENTA', label: 'Venta' },
    { value: 'AJUSTE', label: 'Ajuste' },
    { value: 'DEVOLUCION', label: 'Devolución' }
  ];

  readonly desktopCols = ['productCode', 'previousStock', 'quantity', 'newStock', 'movementType', 'description', 'createdBy', 'movementDate'];
  readonly tabletCols  = ['productCode', 'quantity', 'movementType', 'movementDate'];
  readonly mobileCols  = ['productCode', 'quantity', 'movementType'];

  displayedColumns = this.desktopCols;

  ngOnInit(): void {
    this.loadProducts();
    this.setupProductAutocomplete();
    this.loadMovements();

    this.movementTypeControl.valueChanges.subscribe(() => {
      this.loadMovements()
    });

    this.subs.add(
      this.breakpoint.observe([
        '(max-width: 599px)',
        '(min-width: 600px) and (max-width: 959px)'
      ]).subscribe(result => {
        if (result.breakpoints['(max-width: 599px)']) {
          this.displayedColumns = this.mobileCols;
        } else if (result.breakpoints['(min-width: 600px) and (max-width: 959px)']) {
          this.displayedColumns = this.tabletCols;
        } else {
          this.displayedColumns = this.desktopCols;
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  getTotalItems(): number {
    return this.dataSource.filteredData.length;
  }

  get selectedMovementTypeLabel(): string {
    const selected = this.movementTypeOptions.find(
      o => o.value === this.movementTypeControl.value
    );
    return selected?.label || 'Todos los tipos';
  }

  loadProducts(): void {
    this.productService.getProducts(true).subscribe({
      next: (data) => {
        this.products = data;
        this.filteredProducts = this.products;
      },
      error: (err) => console.error(err)
    });
  }

  setupProductAutocomplete(): void {
    this.productControl.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe((value) => {
      const searchText = typeof value === 'string' ? value : '';
      this.filterProducts(searchText);
    });
  }

  onProductSelected(product: Product): void {
    this.selectedProductId = product.id ?? null;
    this.loadMovements();
  }

  clearProductFilter(): void {
    this.productControl.setValue(null);
    this.selectedProductId = null;
    this.loadMovements();
  }

  applyFilter(): void {
    this.dataSource.filter = this.searchTerm.trim().toLowerCase();
    if (this.dataSource.paginator) this.dataSource.paginator.firstPage();
  }

  displayProduct(product: Product | null): string {
    return product ? product.name : '';
  }

  loadMovements(): void {
    this.isLoading = true;

    const productId = this.selectedProductId;
    const movementType = this.movementTypeControl.value;

    if (productId && movementType && movementType !== 'ALL'){
      this.inventoryMovementService.getByProductAndType(productId, movementType).subscribe({
        next: (res) => {
          this.dataSource.data = res.data ?? res;
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error:', err);
          this.isLoading = false;
        }
      });
    } else if (productId) {
      this.inventoryMovementService.getByProduct(productId).subscribe({
        next: (res) => {
          this.dataSource.data = res.data ?? res;
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error:', err);
          this.isLoading = false;
        }
      });
    } else if (movementType && movementType !== 'ALL') {
      this.inventoryMovementService.getByType(movementType).subscribe({
        next: (res) => {
          this.dataSource.data = res.data ?? res;
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error:', err);
          this.isLoading = false;
        }
      });
    } else {
      this.inventoryMovementService.getDevolutionsAndAdujustments().subscribe({
        next: (res) => {
          this.dataSource.data = res.data ?? res;
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error:', err);
          this.isLoading = false;
        }
      });
    }
  }

  getMovementTypeColor(type: string): string {
    const colors: Record<string, string> = {
      'COMPRA':    'chip-compra',
      'VENTA':     'chip-venta',
      'AJUSTE':    'chip-ajuste',
      'DEVOLUCION':'chip-devolucion'
    };
    return colors[type?.toUpperCase()] || 'chip-default';
  }

  getMovementTypeIcon(type: string): string {
    const icons: Record<string, string> = {
      'COMPRA':    'shopping_cart',
      'VENTA':     'point_of_sale',
      'AJUSTE':    'tune',
      'DEVOLUCION':'undo'
    };
    return icons[type?.toUpperCase()] || 'swap_horiz';
  }

  private filterProducts(searchText: string): void {
    if (!searchText) {
      this.filteredProducts = this.products;
      return;
    }

    const filterValue = searchText.toLowerCase().trim();
    this.filteredProducts = this.products.filter(p =>
      p.name.toLowerCase().includes(filterValue) || p.code.toLowerCase().includes(filterValue)
    );
  }

  trackById(index: number, item: InventoryMovement): number {
    return item.id ?? index;
  }

}
