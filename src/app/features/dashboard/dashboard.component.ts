import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MaterialModule } from '../../shared/material-module';
import { HasRoleDirective } from '../../core/directives/has-role.directive';
import { ProductService } from '../../core/services/product.service';
import { Product } from '../../shared/models/product';
import { PurchaseOrderService } from '../../core/services/purchase-order.service';
import { PurchaseOrder } from '../../shared/models/purchase-order.models';
import { CategoryService } from '../../core/services/category.service';
import { SupplierService } from '../../core/services/supplier.service';
import { ClientService } from '../../core/services/client.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard.component',
  imports: [
    CommonModule,
    MaterialModule,
    HasRoleDirective,
    CurrencyPipe
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {

  private productService = inject(ProductService);
  private purchaseOrderService = inject(PurchaseOrderService);
  private categoryService = inject(CategoryService);
  private supplierService = inject(SupplierService);
  private clientService = inject(ClientService);
  private router = inject(Router);

  pendingOrders: number = 0;
  categoriesCount: number = 0;
  suppliersCount: number = 0;
  clientsCount: number = 0;
  inventoryValue: number = 0;
  activeProducts: number = 0;
  lowStockProducts: Product[] = [];
  isLoading = true;

  displayedColumnsCompact: string[] = ['code', 'stock', 'minimumStock'];

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {

    this.productService.getInventoryValue().subscribe({
      next: (res) => {
        this.inventoryValue = res.data;
        console.log(this.inventoryValue)
      },
      error: (err) => console.error('Error cargando inventory value:', err)
    });

    this.productService.getLowStock().subscribe(data => {
      this.lowStockProducts = data;
      this.isLoading = false;
    });

    this.productService.countActiveProducts().subscribe({
      next: (res) => {
        this.activeProducts = res.data;
      },
      error: (err) => console.error('Error cargando inventory value:', err)
    });

    this.purchaseOrderService.countByStatus('PENDIENTE').subscribe({
      next: (res) => {
        this.pendingOrders = res.data;
      },
      error: (err) => console.error('Error cargando inventory value:', err)
    });

    this.categoryService.countCategories().subscribe({
      next: (res) => {
        this.categoriesCount = res.data;
      },
      error: (err) => console.error('Error cargando inventory value:', err)
    });

    this.clientService.countActiveClients().subscribe({
      next: (res) => {
        this.clientsCount = res.data;
      },
      error: (err) => console.error('Error cargando inventory value:', err)
    });

    this.supplierService.countActiveSuppliers().subscribe({
      next: (res) => {
        this.suppliersCount = res.data;
      },
      error: (err) => console.error('Error cargando inventory value:', err)
    });

  }

  goToAddNewProduct(): void {
    this.router.navigate(['/product/new']);
  }

  goToPurchaseOrders(): void {
    this.router.navigate(['/purchase-orders']);
  }

  goToSuppliers(): void {
    this.router.navigate(['/supplier']);
  }

  goToInventoryMovements(): void {
    this.router.navigate(['/inventory-movement']);
  }

  get lowStockProductsLimited() {
    return this.lowStockProducts.slice(0, this.lowStockProducts.length);
  }

}
