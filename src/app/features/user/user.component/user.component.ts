import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, inject, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../../shared/material-module';
import { RoleNamePipe } from '../../../shared/pipes/role-name-pipe';
import { UserService } from '../../../core/services/user.service';
import { NotificationService } from '../../../core/services/notification.service';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { User } from '../../../shared/models/user';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { CreateUserDialogComponent } from '../create-user-dialog.component/create-user-dialog.component';
import { ChangePasswordDialogComponent } from '../../change-password-dialog.component/change-password-dialog.component';
import { UpdateRolesDialogComponent } from '../../update-roles-dialog.component/update-roles-dialog.component';

@Component({
  selector: 'app-user.component',
  imports: [
    CommonModule,
    FormsModule,
    MaterialModule,
    RoleNamePipe
  ],
  templateUrl: './user.component.html',
  styleUrl: './user.component.scss',
})
export class UserComponent implements OnInit, AfterViewInit {

  private userService = inject(UserService);
  private notify = inject(NotificationService);
  private dialog = inject(MatDialog);

  dataSource = new MatTableDataSource<User>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  searchTerm = '';
  isLoading = false;
  totalItems = 0;

  displayedColumns: string[] = ['username', 'status', 'blocked', 'roles', 'actions'];

  ngOnInit(): void { this.loadUsers(); }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadUsers(): void {
    this.isLoading = true;
    this.userService.getUsers().subscribe({
      next: (data) => {
        this.dataSource.data = data;
        this.totalItems = data.length;
        this.dataSource.filterPredicate = (item: User, filter: string) =>
          item.username.toLowerCase().includes(filter.toLowerCase());
        this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.notify.error('Error', 'No se pudieron cargar los usuarios');
        this.isLoading = false;
      }
    });
  }

  applyFilter(): void {
    this.dataSource.filter = this.searchTerm.trim().toLowerCase();
    if (this.dataSource.paginator) this.dataSource.paginator.firstPage();
  }

  openCreateUserDialog(): void {
    const dialogRef = this.dialog.open(CreateUserDialogComponent, {
      width: '550px', maxWidth: '95vw', disableClose: true
    });
    dialogRef.afterClosed().subscribe(s => { if (s) this.loadUsers(); });
  }

  openChangePasswordDialog(user: User): void {
    this.dialog.open(ChangePasswordDialogComponent, {
      width: '480px',
      data: { user },
      disableClose: true
    }).afterClosed().subscribe(s => { if (s) this.loadUsers(); });
  }

  openUpdateRolesDialog(user: User): void {
    this.dialog.open(UpdateRolesDialogComponent, {
      width: '400px',
      data: { user },
      disableClose: true
    }).afterClosed().subscribe(s => { if (s) this.loadUsers(); });
  }

  activateUser(user: User): void {
    this.notify.confirm('¿Activar usuario?', `¿Activas al usuario "${user.username}"?`)
      .then(r => {
        if (r.isConfirmed) {
          this.userService.activateUser(user.id as number).subscribe({
            next: () => { this.notify.success('¡Activado!'); this.loadUsers(); },
            error: err => this.notify.error('Error', err.error?.message)
          });
        }
      });
  }

  deactivateUser(user: User): void {
    this.notify.confirm('¿Desactivar usuario?', `¿Desactivas al usuario "${user.username}"?`)
      .then(r => {
        if (r.isConfirmed) {
          this.userService.desactivateUser(user.id as number).subscribe({
            next: () => { this.notify.success('¡Desactivado!'); this.loadUsers(); },
            error: err => this.notify.error('Error', err.error?.message)
          });
        }
      });
  }

  unblockUser(user: User): void {
    this.notify.confirm('¿Desbloquear usuario?', `¿Desbloqueas al usuario "${user.username}"?`)
      .then(r => {
        if (r.isConfirmed) {
          this.userService.unblockUser(user.id as number).subscribe({
            next: () => { this.notify.success('¡Desbloqueado!'); this.loadUsers(); },
            error: err => this.notify.error('Error', err.error?.message)
          });
        }
      });
  }

  deleteUser(user: User): void {
    this.notify.confirm('¿Eliminar usuario?', `Esta acción es irreversible. ¿Eliminas a "${user.username}"?`)
      .then(r => {
        if (r.isConfirmed) {
          this.userService.deleteUser(user.id as number).subscribe({
            next: () => { this.notify.success('¡Eliminado!'); this.loadUsers(); },
            error: err => this.notify.error('Error', err.error?.message)
          });
        }
      });
  }

  trackById(index: number, item: User): number {
    return (item.id as number) ?? index;
  }

}
