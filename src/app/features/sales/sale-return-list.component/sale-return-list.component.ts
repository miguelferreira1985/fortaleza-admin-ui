// return-list.component.ts  →  features/pos/return-list/return-list.component.ts

import { CommonModule, CurrencyPipe } from '@angular/common';
import { AfterViewInit, Component, inject, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { MaterialModule } from '../../../shared/material-module';
import { HasRoleDirective } from '../../../core/directives/has-role.directive';
import { SaleService } from '../../../core/services/sale.service';
import { NotificationService } from '../../../core/services/notification.service';
import { SaleReturnResponse, ReturnType } from '../../../shared/models/sale.models';
import { SaleReturnDialogComponent } from '../sale-return-dialog.component/sale-return-dialog.component';
import { FreeReturnDialogComponent } from '../free-return-dialog.component/free-return-dialog.component';
import { SaleReturnReceiptDialogComponent } from '../sale-return-receipt-dialog.component/sale-return-receipt-dialog.component';

@Component({
  selector: 'app-return-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MaterialModule,
    HasRoleDirective,
    CurrencyPipe
  ],
  templateUrl: './sale-return-list.component.html',
  styleUrl: './sale-return-list.component.scss'
})
export class SaleReturnListComponent implements OnInit, AfterViewInit {

  private saleService = inject(SaleService);
  private notify = inject(NotificationService);
  private dialog = inject(MatDialog);
  private router = inject(Router);

  dataSource = new MatTableDataSource<SaleReturnResponse>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  isLoading = false;
  totalItems = 0;
  searchTerm = '';

  selectedType: ReturnType | 'ALL' | 'FREE' = 'ALL';
  readonly typeOptions = [
    { value: 'ALL',     label: 'Todas'          },
    { value: 'TOTAL',   label: 'Totales'         },
    { value: 'PARCIAL', label: 'Parciales'       },
    { value: 'FREE',    label: 'Sin ticket'      }
  ];

  displayedColumns = [
    'folio', 'returnDate', 'employeeName',
    'saleFolio', 'returnType', 'totalRefunded',
    'refundMethod', 'actions'
  ];

  ngOnInit(): void { this.loadReturns(); }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadReturns(): void {
    this.isLoading = true;
    this.saleService.getAllReturns().subscribe({
      next: (res) => {
        this.dataSource.data = res.data ?? [];
        this.totalItems = res.data?.length ?? 0;
        this.setupFilter();
        this.applyFilters();
        this.isLoading = false;
      },
      error: () => { this.isLoading = false; }
    });
  }

  applyFilters(): void {
    this.dataSource.filter = JSON.stringify({
      term: this.searchTerm.trim().toLowerCase(),
      type: this.selectedType
    });
    if (this.dataSource.paginator) this.dataSource.paginator.firstPage();
  }

  openFreeReturnDialog(): void {
    this.dialog.open(FreeReturnDialogComponent, {
      width: '500px',
      disableClose: true
    }).afterClosed().subscribe(success => {
      if (success) this.loadReturns();
    });
  }

  openReceipt(ret: SaleReturnResponse): void {
    this.dialog.open(SaleReturnReceiptDialogComponent, {
      width: '420px',
      data: { saleReturn: ret },
      panelClass: 'receipt-dialog'
    });
  }

  goToSaleDetail(ret: SaleReturnResponse): void {
    if (ret.saleId) this.router.navigate(['/pos/sales', ret.saleId]);
  }

  getTypeConfig(ret: SaleReturnResponse): { label: string; cssClass: string } {
    if (ret.freeReturn) return { label: 'Sin ticket', cssClass: 'type-free' };
    if (ret.returnType === 'TOTAL') return { label: 'Total', cssClass: 'type-total' };
    return { label: 'Parcial', cssClass: 'type-parcial' };
  }

  getMethodLabel(method: string): string {
    const labels: Record<string, string> = {
      EFECTIVO: 'Efectivo', TARJETA: 'Tarjeta', TRANSFERENCIA: 'Transf.'
    };
    return labels[method] ?? method;
  }

  getMethodIcon(method: string): string {
    const icons: Record<string, string> = {
      EFECTIVO: 'payments', TARJETA: 'credit_card', TRANSFERENCIA: 'account_balance'
    };
    return icons[method] ?? 'attach_money';
  }

  trackById(_: number, ret: SaleReturnResponse): number { return ret.id; }

  private setupFilter(): void {
    this.dataSource.filterPredicate = (ret: SaleReturnResponse, filter: string) => {
      const { term, type } = JSON.parse(filter);

      const matchesType = type === 'ALL'
        || (type === 'FREE' && ret.freeReturn)
        || (!ret.freeReturn && ret.returnType === type);

      const matchesTerm = !term || (
        ret.folio.toLowerCase().includes(term) ||
        ret.saleFolio?.toLowerCase().includes(term) ||
        ret.employeeName.toLowerCase().includes(term) ||
        ret.reason?.toLowerCase().includes(term)
      );

      return matchesType && matchesTerm;
    };
  }
}
