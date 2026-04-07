import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, inject, OnInit, ViewChild } from '@angular/core';
import { MaterialModule } from '../../../shared/material-module';
import { FormsModule } from '@angular/forms';
import { HasRoleDirective } from '../../../core/directives/has-role.directive';
import { SupplierService } from '../../../core/services/supplier.service';
import { NotificationService } from '../../../core/services/notification.service';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { MatTableDataSource } from '@angular/material/table';
import { Supplier } from '../../../shared/models/supplier';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { SupplierDialogComponent } from '../supplier-dialog.component/supplier-dialog.component';

@Component({
  selector: 'app-supplier.component',
  imports: [
    CommonModule,
    MaterialModule,
    FormsModule,
    HasRoleDirective
  ],
  templateUrl: './supplier.component.html',
  styleUrl: './supplier.component.scss',
})
export class SupplierComponent implements OnInit, AfterViewInit {

  private supplierService = inject(SupplierService);
  private notify = inject(NotificationService);
  private dialog = inject(MatDialog);
  private router = inject(Router);

  dataSource = new MatTableDataSource<Supplier>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  searchTerm = '';
  isLoading = false;
  totalItems = 0;
  showActive = true;

  displayedColumns: string[] = ['name', 'contact', 'email', 'location', 'actions'];

  ngOnInit(): void {
    this.loadSuppliers();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadSuppliers(): void {
    this.isLoading = true;
    this.supplierService.getSuppliers(this.showActive).subscribe({
      next: (data) => {
        this.dataSource.data = data;
        this.totalItems = data.length;
        this.dataSource.filterPredicate = (item: Supplier, filter: string) => {
          const search = filter.toLowerCase();
          return (
            item.name.toLowerCase().includes(search) ||
            item.contact.toLowerCase().includes(search) ||
            (item.location?.toLowerCase().includes(search) ?? false) ||
            (item.email?.toLowerCase().includes(search) ?? false)
          );
        };
        this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.notify.error('Error', 'No se pudieron cargar los proveedores');
        this.isLoading = false;
      }
    });
  }

  toggleFilter(): void {
    this.showActive = !this.showActive;
    this.loadSuppliers();
  }

  applyFilter(): void {
    this.dataSource.filter = this.searchTerm.trim().toLowerCase();
    if (this.dataSource.paginator) this.dataSource.paginator.firstPage();
  }

  openCreateDialog(): void {
    const dialogRef = this.dialog.open(SupplierDialogComponent, {
      width: '650px',
      maxWidth: '95vw',
      data: { supplier: null },
      disableClose: true
    });
    dialogRef.afterClosed().subscribe((success: boolean) => {
      if (success) this.loadSuppliers();
    });
  }

  openEditDialog(supplier: Supplier): void {
    const dialogRef = this.dialog.open(SupplierDialogComponent, {
      width: '650px',
      maxWidth: '95vw',
      data: { supplier: { ...supplier } },
      disableClose: true
    });
    dialogRef.afterClosed().subscribe((success: boolean) => {
      if (success) this.loadSuppliers();
    });
  }

  deactivateSupplier(supplier: Supplier): void {
    this.notify.confirm(
      '¿Desactivar proveedor?',
      `El proveedor "${supplier.name}" será desactivado y sus productos asociados serán desvinculados.`
    ).then((result) => {
      if (result.isConfirmed && supplier.id) {
        this.supplierService.deleteSupplier(supplier.id).subscribe({
          next: () => {
            this.notify.success('¡Desactivado!', 'El proveedor fue desactivado.');
            this.loadSuppliers();
          },
          error: (err) => {
            this.notify.error('Error', err?.error?.message || 'No se pudo desactivar');
          }
        });
      }
    });
  }

  goToPurchaseOrders(supplierId: number): void {
    this.router.navigate(['/suppliers', supplierId, 'purchase-orders']);
  }

  trackById(index: number, item: Supplier): number {
    return item.id ?? index;
  }

}
