import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
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
import { BreakpointObserver } from '@angular/cdk/layout';
import { Subscription } from 'rxjs';
import { dialogConfig } from '../../../core/utils/dialog.util';

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
export class EmployeeComponent implements OnInit, OnDestroy, AfterViewInit{

  private employeeService = inject(EmployeeService);
  private notify = inject(NotificationService);
  private dialog = inject(MatDialog);
  private breakpoint = inject(BreakpointObserver);

  private subs = new Subscription();

  dataSource = new MatTableDataSource<Employee>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  searchTerm = '';
  isLoading = false;
  totalItems = 0;
  showActive = true;

  readonly desktopCols = ['name', 'phone', 'email', 'user', 'status', 'actions'];
  readonly tabletCols  = ['name', 'phone', 'status', 'actions'];
  readonly mobileCols  = ['name', 'status', 'actions'];
  displayedColumns = this.desktopCols

  ngOnInit(): void {
    this.loadEmployees();

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
    const dialogRef = this.dialog.open(EmployeeDialogComponent,
      dialogConfig('700px', {
        data: { employee: null },
        disableClose: true
      })
    );
    dialogRef.afterClosed().subscribe((success: boolean) => {
      if (success) this.loadEmployees();
    });
  }

  openEditDialog(employee: Employee): void {
    const dialogRef = this.dialog.open(EmployeeDialogComponent,
      dialogConfig('700px', {
        data: { employee: { ...employee } },
        disableClose: true
      })
    );
    dialogRef.afterClosed().subscribe((success: boolean) => {
      if (success) this.loadEmployees();
    });
  }

  deactivateEmployee(employee: Employee): void {
    this.notify.confirm(
      '¿Desactivar empleado?',
      `El empleado "${employee.firstName} ${employee.lastName}" será desactivado.`
    ).then((confimed) => {
      if (confimed && employee.id) {
        this.employeeService.deactivateEmployee(employee.id).subscribe({
          next: (res) => {
            this.notify.success('¡Desactivado!', res.message || 'El empleado fue desactivado.');
            this.loadEmployees();
          },
          error: (err) => {
            this.notify.error('Error', err?.error?.message || 'No se pudo desactivar');
          }
        });
      }
    });
  }

  activateEmployee(employee: Employee): void {
    this.notify.confirm(
      '¿activar empleado?',
      `El empleado "${employee.firstName} ${employee.lastName}" será activado.`
    ).then((confimed) => {
      if (confimed && employee.id) {
        this.employeeService.activateEmployee(employee.id).subscribe({
          next: (res) => {
            this.notify.success('¡Activado!', res.message || 'El empleado fue activado.');
            this.loadEmployees();
          },
          error: (err) => {
            this.notify.error('Error', err?.error?.message || 'No se pudo activar');
          }
        });
      }
    });
  }

  trackById(index: number, item: Employee): number {
    return item.id ?? index;
  }

}
