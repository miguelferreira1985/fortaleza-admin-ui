import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { MaterialModule } from '../../../shared/material-module';
import { SaleService } from '../../../core/services/sale.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ActivatedRoute, Router } from '@angular/router';
import { BillingClientDetail } from '../../../shared/models/sale.models';

@Component({
  selector: 'app-billing-client-detail.component',
  imports: [
    CommonModule,
    MaterialModule,
    CurrencyPipe,
    DatePipe
  ],
  templateUrl: './billing-client-detail.component.html',
  styleUrl: './billing-client-detail.component.scss',
})
export class BillingClientDetailComponent implements OnInit {

  private saleService = inject(SaleService);
  private notify = inject(NotificationService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  clientId!: number;
  clientName = '';
  clientRfc = '';
  dateFrom = '';
  dateTo = '';

  sales: BillingClientDetail[] = [];
  isLoading = false;

    get cashSales(): BillingClientDetail[] {
    return this.sales.filter(s => s.paymentMethod === 'EFECTIVO');
  }

  get cardSales(): BillingClientDetail[] {
    return this.sales.filter(s => s.paymentMethod === 'TARJETA');
  }

  get transferSales(): BillingClientDetail[] {
    return this.sales.filter(s => s.paymentMethod === 'TRANSFERENCIA');
  }

  get cashTotal(): number {
    return this.cashSales.reduce((sum, s) => sum + s.total, 0);
  }

  get cardTotal(): number {
    return this.cardSales.reduce((sum, s) => sum + s.total, 0);
  }

  get transferTotal(): number {
    return this.transferSales.reduce((sum, s) => sum + s.total, 0);
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.clientId = +params['clientId'];
    });

    this.route.queryParams.subscribe(params => {
      this.dateFrom = params['from'] || '';
      this.dateTo = params['to'] || '';
      this.clientName = params['clientName'] || '';
      this.clientRfc = params['clientRfc'] || '';

      if (this.clientId && this.dateFrom && this.dateTo) {
        this.loadSales();
      }
    });
  }

  loadSales(): void {
    this.isLoading = true;
    this.saleService.getBillingClientDetails(this.clientId, this.dateFrom, this.dateTo).subscribe({
      next: (res) => {
        this.sales = res.data ?? [];
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        this.notify.error('Error', err.error?.message || 'No se pudo cargar la información');
      }
    });
  }

  viewSaleDetail(sale: BillingClientDetail): void {
    this.router.navigate(['/pos/billing/items'], {
      queryParams: {
        clientId: this.clientId,
        from: this.dateFrom,
        to: this.dateTo,
        paymentMethod: sale.paymentMethod,
        saleId: sale.saleId, // null para efectivo acumulado
        folio: sale.folio,
        clientName: this.clientName
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/pos/billing']);
  }

  printCashReport(): void {
    window.print();
  }

}
