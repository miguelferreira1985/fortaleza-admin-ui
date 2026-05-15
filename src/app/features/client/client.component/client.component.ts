import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MaterialModule } from '../../../shared/material-module';
import { FormsModule } from '@angular/forms';
import { ClientService } from '../../../core/services/client.service';
import { NotificationService } from '../../../core/services/notification.service';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { Client } from '../../../shared/models/client';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { ClientDialogComponent } from '../client-dialog.component/client-dialog.component';
import { HasRoleDirective } from '../../../core/directives/has-role.directive';
import { BreakpointObserver } from '@angular/cdk/layout';
import { Subscription } from 'rxjs';
import { dialogConfig } from '../../../core/utils/dialog.util';

@Component({
  selector: 'app-client.component',
  imports: [
    CommonModule,
    MaterialModule,
    FormsModule,
    HasRoleDirective
  ],
  templateUrl: './client.component.html',
  styleUrl: './client.component.scss',
})
export class ClientComponent implements OnInit, OnDestroy, AfterViewInit {

  private clientService = inject(ClientService);
  private notify = inject(NotificationService);
  private dialog = inject(MatDialog);
  private breakpoint = inject(BreakpointObserver);

  private subs = new Subscription();

  dataSource = new MatTableDataSource<Client>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  searchTerm = '';
  isLoading = false;
  totalItems = 0;
  showActive = true;

  readonly desktopCols = ['name', 'rfc', 'phone', 'status', 'actions'];
  readonly tabletCols  = ['name', 'rfc', 'status', 'actions'];
  readonly mobileCols  = ['name', 'status', 'actions'];

  displayedColumns = this.desktopCols

  ngOnInit(): void {
    this.loadClients();

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

  loadClients(): void {
    this.isLoading = true;
    this.clientService.getClients(this.showActive).subscribe({
      next: (data) => {
        this.dataSource.data = data;
        this.totalItems = data.length;
        this.dataSource.filterPredicate = (item: Client, filter: string) => {
          const search = filter.toLowerCase();
          return (
            item.name.toLowerCase().includes(search) ||
            item.rfc.toLowerCase().includes(search) ||
            (item.phone?.toLowerCase().includes(search) ?? false)
          );
        };
        this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.notify.error('Error', 'No se pudieron cargar los clientes');
        this.isLoading = false;
      }
    });
  }

  // 👈 Cambia entre activos e inactivos
  toggleFilter(): void {
    this.showActive = !this.showActive;
    this.loadClients();
  }

  applyFilter(): void {
    this.dataSource.filter = this.searchTerm.trim().toLowerCase();
    if (this.dataSource.paginator) this.dataSource.paginator.firstPage();
  }

  openCreateDialog(): void {
    const dialogRef = this.dialog.open(ClientDialogComponent,
      dialogConfig('500px', {
        data: { client: null },
        disableClose: true
      })
    );
    dialogRef.afterClosed().subscribe((success: boolean) => {
      if (success) this.loadClients();
    });
  }

  openEditDialog(client: Client): void {
    const dialogRef = this.dialog.open(ClientDialogComponent,
      dialogConfig('500px', {
        data: { client: { ...client } },
        disableClose: true
      })
    );
    dialogRef.afterClosed().subscribe((success: boolean) => {
      if (success) this.loadClients();
    });
  }

  deactivateClient(client: Client): void {
    this.notify.confirm(
      '¿Desactivar cliente?',
      `El cliente "${client.name}" será desactivado pero no eliminado.`
    ).then((confimed) => {
      if (confimed && client.id) {
        this.clientService.deactivateClient(client.id).subscribe({
          next: (res) => {
            this.notify.success('¡Desactivado!', res.message || 'El cliente fue desactivado.');
            this.loadClients();
          },
          error: (err) => {
            this.notify.error('Error', err?.error?.message || 'No se pudo desactivar');
          }
        });
      }
    });
  }

  activateClient(client: Client): void {
    this.notify.confirm(
      '¿Activar cliente?',
      `El cliente "${client.name}" será activado.`
    ).then((confimed) => {
      if (confimed && client.id) {
        this.clientService.activateClient(client.id).subscribe({
          next: (res) => {
            this.notify.success('¡Activado!', res.message || 'El cliente fue activado.');
            this.loadClients();
          },
          error: (err) => {
            this.notify.error('Error', err?.error?.message || 'No se pudo activar');
          }
        });
      }
    });
  }

  trackById(index: number, item: Client): number {
    return item.id ?? index;
  }

}
