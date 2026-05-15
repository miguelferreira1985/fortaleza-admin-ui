import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MaterialModule } from '../../../shared/material-module';
import { SaleService } from '../../../core/services/sale.service';
import { NotificationService } from '../../../core/services/notification.service';
import { SaleResponse, SaleStatus } from '../../../shared/models/sale.models';
import { getSaleStatusConfig } from '../../../core/utils/sale-status.util';
import { BreakpointObserver } from '@angular/cdk/layout';
import { Subscriber, Subscription } from 'rxjs';

@Component({
  selector: 'app-sale-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MaterialModule
  ],
  templateUrl: './sale-list.component.html',
  styleUrl: './sale-list.component.scss'
})
export class SaleListComponent implements OnInit, AfterViewInit, OnDestroy {

  private saleService = inject(SaleService);
  private router      = inject(Router);
  private breakpoint = inject(BreakpointObserver);

  private subs = new Subscription();

  dataSource = new MatTableDataSource<SaleResponse>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  isLoading = false;
  totalItems = 0;
  searchTerm = '';

  // Filtro por status
  selectedStatus: SaleStatus | 'ALL' = 'ALL';
  readonly statusOptions: { value: SaleStatus | 'ALL'; label: string }[] = [
    { value: 'ALL',             label: 'Todos'          },
    { value: 'COMPLETADA',      label: 'Completadas'    },
    { value: 'CANCELADA',       label: 'Canceladas'     },
    { value: 'DEVUELTA',        label: 'Devueltas'      },
    { value: 'DEVUELTA_PARCIAL',label: 'Dev. parciales' }
  ];

  readonly desktopCols = ['folio', 'saleDate', 'employeeName', 'clientName', 'total', 'payments', 'status', 'actions'];
  readonly tabletCols  = ['folio', 'saleDate', 'total', 'status', 'actions'];
  readonly mobileCols  = ['folio', 'total', 'actions'];
  displayedColumns = this.desktopCols;

  ngOnInit(): void {
    this.loadSales();

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

  loadSales(): void {
    this.isLoading = true;
    this.saleService.getAll().subscribe({
      next: (res) => {
        this.dataSource.data = res.data ?? [];
        this.totalItems = res.data?.length ?? 0;
        this.setupFilterPredicate();
        this.applyFilters();
        this.isLoading = false;
      },
      error: () => { this.isLoading = false; }
    });
  }

  applyFilters(): void {
    // Combinamos búsqueda de texto + filtro de estado en el mismo filterPredicate
    this.dataSource.filter = JSON.stringify({
      term: this.searchTerm.trim().toLowerCase(),
      status: this.selectedStatus
    });
    if (this.dataSource.paginator) this.dataSource.paginator.firstPage();
  }

  goToDetail(sale: SaleResponse): void {
    this.router.navigate(['/pos/sales', sale.id]);
  }

  goToPOS(): void {
    this.router.navigate(['/pos/cashier']);
  }

  getStatusConfig(status: SaleStatus) {
    return getSaleStatusConfig(status);
  }

  // Retorna el label del método de pago para mostrar en la tabla
  getPaymentsSummary(sale: SaleResponse): string {
    return sale.payments
      .map(p => {
        const labels: Record<string, string> = {
          EFECTIVO: 'Efectivo', TARJETA: 'Tarjeta', TRANSFERENCIA: 'Transf.'
        };
        return labels[p.paymentMethod] ?? p.paymentMethod;
      })
      .join(' + ');
  }

  trackById(_: number, sale: SaleResponse): number { return sale.id; }

  private setupFilterPredicate(): void {
    this.dataSource.filterPredicate = (sale: SaleResponse, filter: string) => {
      const { term, status } = JSON.parse(filter);

      const matchesStatus = status === 'ALL' || sale.status === status;
      const matchesTerm = !term || (
        sale.folio.toLowerCase().includes(term) ||
        sale.employeeName.toLowerCase().includes(term) ||
        (sale.clientName?.toLowerCase().includes(term) ?? false)
      );

      return matchesStatus && matchesTerm;
    };
  }
}
