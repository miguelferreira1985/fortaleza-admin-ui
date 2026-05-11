import { CommonModule } from '@angular/common';
import { Component, inject, ViewChild } from '@angular/core';
import { MaterialModule } from '../../../shared/material-module';
import { FormsModule } from '@angular/forms';
import { CategoryService } from '../../../core/services/category.service';
import { NotificationService } from '../../../core/services/notification.service';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { Category } from '../../../shared/models/category';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { CategoryDialogComponent } from '../category-dialog.component/category-dialog.component';

@Component({
  selector: 'app-category.component',
  imports: [
    CommonModule,
    FormsModule,
    MaterialModule
  ],
  templateUrl: './category.component.html',
  styleUrl: './category.component.scss',
})
export class CategoryComponent {

  private categoryService = inject(CategoryService);
  private notify = inject(NotificationService);
  private dialog = inject(MatDialog);

  dataSource = new MatTableDataSource<Category>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  searchTerm: string = '';
  isLoading: boolean = false;
  totalItems = 0;

  displayedColumns: string[] = ['name', 'description', 'actions'];

    ngOnInit(): void {
    this.loadCategories();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadCategories(): void {
    this.isLoading = true;

    this.categoryService.getAllCategories().subscribe({
      next: (data) => {
        this.dataSource.data = data;
        this.totalItems = data.length;

        this.dataSource.filterPredicate = (data: Category, filter: string) => {
          const searchStr = filter.toLowerCase();
          return data.name.toLowerCase().includes(searchStr);
        };

        this.isLoading = false;
      },
      error: (err) => {
        this.notify.error('Error', err.message.errors || 'No se pudieron cargar las categorias, intenta mas tarde');
        this.isLoading = false;
      }
    });
  }

  applyFilter(): void {
    const filterValue = this.searchTerm.trim().toLowerCase();
    this.dataSource.filter = filterValue;

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  openCreateDialog(): void {
    const dialogRef= this.dialog.open(CategoryDialogComponent, {
      width: '500px',
      data: { category: null, mode: 'create' },
      disableClose: true
    });

    dialogRef.afterClosed().subscribe((success: boolean) => {
      if (success) {
        this.loadCategories();
      }
    });
  }

  openEditDialog(category: Category): void {
    const dialogRef= this.dialog.open(CategoryDialogComponent, {
      width: '500px',
      data: { category: { ...category }, mode: 'edit' },
      disableClose: true
    });

    dialogRef.afterClosed().subscribe((success: boolean) => {
      if (success) {
        this.loadCategories();
      }
    });
  }

  deleteCategory(category: Category): void {
    this.notify.confirm('¿Estás seguro?', `¿Deseas eliminar la categoría "${category.name}"? Esta acción no se puede deshacer.`)
      .then((confimed) => {
        if (confimed && category.id) {
          let id: number = category.id ?? 0;
          this.categoryService.deleteCategory(id).subscribe({
            next: (res) => {
              this.notify.success('¡Eliminado!', res.message || 'La categoría fue eliminada');
              this.loadCategories();
            },
            error: (err) => {
              this.notify.error('Error', err?.error?.message || 'No se pudo eliminar');
            }
          });
        }
      });
  }

  trackById(index: number, item: Category): number {
    return item.id ?? index;
  }

}
