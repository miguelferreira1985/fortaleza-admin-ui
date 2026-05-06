import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { MaterialModule } from '../../../shared/material-module';
import { SaleService } from '../../../core/services/sale.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ActivatedRoute, Router } from '@angular/router';
import { BillingItemDetail, PaymentMethod } from '../../../shared/models/sale.models';

@Component({
  selector: 'app-billing-sale-detail.component',
  imports: [
    CommonModule,
    MaterialModule,
    CurrencyPipe,
    DatePipe
  ],
  templateUrl: './billing-sale-detail.component.html',
  styleUrl: './billing-sale-detail.component.scss',
})
export class BillingSaleDetailComponent implements OnInit {

  private saleService = inject(SaleService);
  private notify = inject(NotificationService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  clientId!: number;
  clientName = '';
  dateFrom = '';
  dateTo = '';
  paymentMethod: PaymentMethod = 'EFECTIVO';
  saleId: number | null = null;
  folio = '';

  items: BillingItemDetail[] = [];
  isLoading = false;

  get isAccumulated(): boolean {
    return this.saleId === null;
  }

  get total(): number {
    return this.items.reduce((sum, item) => sum + item.subtotal, 0);
  }

  get totalProducts(): number {
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.clientId = +params['clientId'];
      this.dateFrom = params['from'] || '';
      this.dateTo = params['to'] || '';
      this.paymentMethod = params['paymentMethod'] as PaymentMethod;
      this.saleId = params['saleId'] ? +params['saleId'] : null;
      this.folio = params['folio'] || '';
      this.clientName = params['clientName'] || '';

      if (this.clientId && this.dateFrom && this.dateTo) {
        this.loadItems();
      }
    });
  }

  loadItems(): void {
    this.isLoading = true;
    this.saleService.getBillingItems(
      this.clientId,
      this.dateFrom,
      this.dateTo,
      this.paymentMethod,
      this.saleId
    ).subscribe({
      next: (res) => {
        this.items = res.data ?? [];
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        this.notify.error('Error', err.error?.message || 'No se pudo cargar la información');
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/pos/billing/client', this.clientId], {
      queryParams: {
        from: this.dateFrom,
        to: this.dateTo,
        clientName: this.clientName
      }
    });
  }

  print(): void {
    window.print();
  }

}
