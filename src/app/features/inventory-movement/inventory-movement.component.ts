import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, inject, OnInit, ViewChild } from '@angular/core';
import { MaterialModule } from '../../shared/material-module';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ProductService } from '../../core/services/product.service';
import { InventoryMovementService } from '../../core/services/inventory-movement.service';
import { MatTableDataSource } from '@angular/material/table';
import { InventoryMovement } from '../../shared/models/inventory-movement';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { Product } from '../../shared/models/product';

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
export class InventoryMovementComponent implements OnInit, AfterViewInit{

  private productService = inject(ProductService);
  private inventoryMovementService = inject(InventoryMovementService);

  dataSource = new MatTableDataSource<InventoryMovement>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  // Autocomplete de producto
  productControl = new FormControl<Product | string | null>(null);
  allProducts: Product[] = [];
  filteredProducts: Product[] = [];
  selectedProductId: number | null = null;

  searchTerm = '';
  isLoading = false;
  totalItems = 0;

  displayedColumns: string[] = [
    'productCode', 'previousStock', 'quantity',
    'newStock', 'movementType', 'description', 'createdBy', 'movementDate'
  ];

  ngOnInit(): void {
    this.loadProducts();
    this.loadInitialMovements();

    // Escuchar cambios en el autocomplete
    this.productControl.valueChanges.subscribe(val => {
      if (typeof val === 'string') {
        this.filteredProducts = this.filterProducts(val);
      } else if (val && typeof val === 'object') {
        this.filteredProducts = this.allProducts;
      } else {
        this.filteredProducts = this.allProducts;
      }
    });
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadProducts(): void {
    this.productService.getProducts(true).subscribe({
      next: (data) => {
        this.allProducts = data;
        this.filteredProducts = data;
      },
      error: (err) => console.error(err)
    });
  }

  loadInitialMovements(): void {
    this.isLoading = true;
    this.inventoryMovementService.getDevolutionsAndAdujustments().subscribe({
      next: (res) => {
        this.setMovements(res.data);
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
      }
    });
  }

  onProductSelected(product: Product): void {
    this.selectedProductId = product.id ?? null;
    this.isLoading = true;

    this.inventoryMovementService.getByProduct(product.id!).subscribe({
      next: (res) => this.setMovements(res.data),
      error: (err) => {
        console.error(err);
        this.isLoading = false;
      }
    });
  }

  clearProductFilter(): void {
    this.productControl.setValue(null);
    this.selectedProductId = null;
    this.loadInitialMovements();
  }

  applyFilter(): void {
    this.dataSource.filter = this.searchTerm.trim().toLowerCase();
    if (this.dataSource.paginator) this.dataSource.paginator.firstPage();
  }

  displayProduct(product: Product | null): string {
    return product ? product.name : '';
  }

  // Colores para el chip del tipo de movimiento
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

  private setMovements(data: InventoryMovement[]): void {
    this.dataSource.data = data;
    this.totalItems = data.length;
    this.dataSource.filterPredicate = (item: InventoryMovement, filter: string) => {
      const search = filter.toLowerCase();
      return (
        (item.productCode?.toLowerCase().includes(search) ?? false) ||
        (item.movementType?.toLowerCase().includes(search) ?? false) ||
        (item.createdBy?.toLowerCase().includes(search) ?? false) ||
        (item.description?.toLowerCase().includes(search) ?? false)
      );
    };
    this.isLoading = false;
  }

  private filterProducts(value: string): Product[] {
    const search = value.toLowerCase();
    return this.allProducts.filter(p =>
      p.name.toLowerCase().includes(search) ||
      p.code.toLowerCase().includes(search)
    );
  }

  trackById(index: number, item: InventoryMovement): number {
    return item.id ?? index;
  }

}
