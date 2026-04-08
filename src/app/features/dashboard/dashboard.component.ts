import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MaterialModule } from '../../shared/material-module';
import { HasRoleDirective } from '../../core/directives/has-role.directive';
import { ProductService } from '../../core/services/product.service';
import { Product } from '../../shared/models/product';

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

  inventoryValue: number = 0;
  activeProducts: Product[] = [];
  lowStockProducts: Product[] = [];
  isLoading = true;

  // Columnas de la tabla Material
  displayedColumns: string[] = ['code', 'stock', 'minimumStock', 'recommendedStock'];

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.productService.getInventoryValue().subscribe(value => {
      this.inventoryValue = value;
    });

    this.productService.getLowStock().subscribe(data => {
      this.lowStockProducts = data;
      this.isLoading = false;
    });

    this.productService.getProducts(true).subscribe(data => {
      this.activeProducts = data;
    });
  }

}
