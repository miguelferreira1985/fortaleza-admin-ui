import { CommonModule } from '@angular/common';
import { Component, inject, ViewChild } from '@angular/core';
import { MaterialModule } from '../../../shared/material-module';
import { FormsModule } from '@angular/forms';
import { SubcategoryService } from '../../../core/services/subcategory.service';
import { NotificationService } from '../../../core/services/notification.service';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { Subcategory } from '../../../shared/models/subcategory';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { SubcategoryDialogComponent } from '../subcategory-dialog.component/subcategory-dialog.component';

@Component({
  selector: 'app-subcategory.component',
  imports: [
    CommonModule,
    MaterialModule,
    FormsModule
  ],
  templateUrl: './subcategory.component.html',
  styleUrl: './subcategory.component.scss',
})
export class SubcategoryComponent {

  private subcategoryService = inject(SubcategoryService);
  private notify = inject(NotificationService);
  private dialog = inject(MatDialog);

  dataSource = new MatTableDataSource<Subcategory>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  searchTerm = '';
  isLoading = false;
  totalItems = 0;

  displayedColumns: string[] = ['name', 'description', 'category', 'actions'];

  ngOnInit(): void {
    this.loadSubcategories();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadSubcategories(): void {
    this.isLoading = true;
    this.subcategoryService.getSubcategories().subscribe({
      next: (data) => {
        this.dataSource.data = data;
        this.totalItems = data.length;
        this.dataSource.filterPredicate = (item: Subcategory, filter: string) => {
          const search = filter.toLowerCase();
          return (
            item.name.toLowerCase().includes(search) ||
            (item.category?.name?.toLowerCase().includes(search) ?? false)
          );
        };
        this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.notify.error('Error', 'No se pudieron cargar las subcategorías');
        this.isLoading = false;
      }
    });
  }

  applyFilter(): void {
    this.dataSource.filter = this.searchTerm.trim().toLowerCase();
    if (this.dataSource.paginator) this.dataSource.paginator.firstPage();
  }

  openCreateDialog(): void {
    const dialogRef = this.dialog.open(SubcategoryDialogComponent, {
      width: '520px',
      data: { subcategory: null },
      disableClose: true
    });
    dialogRef.afterClosed().subscribe((success: boolean) => {
      if (success) this.loadSubcategories();
    });
  }

  openEditDialog(subcategory: Subcategory): void {
    const dialogRef = this.dialog.open(SubcategoryDialogComponent, {
      width: '520px',
      data: { subcategory: { ...subcategory } },
      disableClose: true
    });
    dialogRef.afterClosed().subscribe((success: boolean) => {
      if (success) this.loadSubcategories();
    });
  }

  deleteSubcategory(subcategory: Subcategory): void {
    this.notify.confirm(
      '¿Estás seguro?',
      `¿Deseas eliminar la subcategoría "${subcategory.name}"? Esta acción no se puede deshacer.`
    ).then((confirmed) => {
      if (confirmed && subcategory.id) {
        this.subcategoryService.deleteSubcategory(subcategory.id).subscribe({
          next: (res) => {
            this.notify.success('¡Eliminada!', res.message || 'La subcategoría fue eliminada.');
            this.loadSubcategories();
          },
          error: (err) => {
            this.notify.error('Error', err?.error?.message || 'No se pudo eliminar');
          }
        });
      }
    });
  }

  trackById(index: number, item: Subcategory): number {
    return item.id ?? index;
  }

}
