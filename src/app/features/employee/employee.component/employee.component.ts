import { CommonModule } from '@angular/common';
import { Component, inject, ViewChild } from '@angular/core';
import { MaterialModule } from '../../../shared/material-module';
import { FormsModule } from '@angular/forms';
import { EmployeeService } from '../../../core/services/employee.service';
import { NotificationService } from '../../../core/services/notification.service';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { Employee } from '../../../shared/models/employee';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { EmployeeDialogComponent } from '../employee-dialog.component/employee-dialog.component';
import { HasRoleDirective } from '../../../core/directives/has-role.directive';

@Component({
  selector: 'app-employee.component',
  imports: [
    CommonModule,
    MaterialModule,
    FormsModule,
    HasRoleDirective
  ],
  templateUrl: './employee.component.html',
  styleUrl: './employee.component.scss',
})
export class EmployeeComponent {

  private employeeService = inject(EmployeeService);
  private notify = inject(NotificationService);
  private dialog = inject(MatDialog);

  dataSource = new MatTableDataSource<Employee>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  searchTerm = '';
  isLoading = false;
  totalItems = 0;
  showActive = true;

  displayedColumns: string[] = ['name', 'phone', 'email', 'user', 'status', 'actions'];

  ngOnInit(): void {
    this.loadEmployees();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadEmployees(): void {
    this.isLoading = true;
    this.employeeService.getEmployees(this.showActive).subscribe({
      next: (data) => {
        this.dataSource.data = data;
        this.totalItems = data.length;
        this.dataSource.filterPredicate = (item: Employee, filter: string) => {
          const search = filter.toLowerCase();
          return (
            item.firstName.toLowerCase().includes(search) ||
            item.lastName.toLowerCase().includes(search) ||
            (item.ssn?.toLowerCase().includes(search) ?? false) ||
            (item.user?.username?.toLowerCase().includes(search) ?? false)
          );
        };
        this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.notify.error('Error', 'No se pudieron cargar los empleados');
        this.isLoading = false;
      }
    });
  }

  toggleFilter(): void {
    this.showActive = !this.showActive;
    this.loadEmployees();
  }

  applyFilter(): void {
    this.dataSource.filter = this.searchTerm.trim().toLowerCase();
    if (this.dataSource.paginator) this.dataSource.paginator.firstPage();
  }

  openCreateDialog(): void {
    const dialogRef = this.dialog.open(EmployeeDialogComponent, {
      width: '700px',
      maxWidth: '95vw',
      data: { employee: null },
      disableClose: true
    });
    dialogRef.afterClosed().subscribe((success: boolean) => {
      if (success) this.loadEmployees();
    });
  }

  openEditDialog(employee: Employee): void {
    const dialogRef = this.dialog.open(EmployeeDialogComponent, {
      width: '700px',
      maxWidth: '95vw',
      data: { employee: { ...employee } },
      disableClose: true
    });
    dialogRef.afterClosed().subscribe((success: boolean) => {
      if (success) this.loadEmployees();
    });
  }

  deactivateEmployee(employee: Employee): void {
    this.notify.confirm(
      '¿Desactivar empleado?',
      `El empleado "${employee.firstName} ${employee.lastName}" será desactivado.`
    ).then((result) => {
      if (result.isConfirmed && employee.id) {
        this.employeeService.deleteEmployee(employee.id).subscribe({
          next: () => {
            this.notify.success('¡Desactivado!', 'El empleado fue desactivado.');
            this.loadEmployees();
          },
          error: (err) => {
            this.notify.error('Error', err?.error?.message || 'No se pudo desactivar');
          }
        });
      }
    });
  }

  trackById(index: number, item: Employee): number {
    return item.id ?? index;
  }

}
