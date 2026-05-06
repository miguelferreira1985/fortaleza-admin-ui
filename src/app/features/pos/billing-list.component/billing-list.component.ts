import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../../shared/material-module';
import { SaleService } from '../../../core/services/sale.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Router } from '@angular/router';
import { BillingClientSummary } from '../../../shared/models/sale.models';

@Component({
  selector: 'app-billing-list.component',
  imports: [
    CommonModule,
    FormsModule,
    MaterialModule,
    CurrencyPipe,
    DatePipe
  ],
  templateUrl: './billing-list.component.html',
  styleUrl: './billing-list.component.scss',
})
export class BillingListComponent implements OnInit {

  private saleService = inject(SaleService);
  private notify = inject(NotificationService);
  private router = inject(Router);

  dateFrom = this.firstDayOfMonth();
  dateTo = this.getTodayDate();

  clients: BillingClientSummary[] = [];
  isLoading = false;

  ngOnInit(): void {
    this.loadClients();
  }

  loadClients(): void {
    this.isLoading = true;
    this.saleService.getBillingClients(this.formatDate(this.dateFrom), this.formatDate(this.dateTo)).subscribe({
      next: (res) => {
        this.clients = res.data ?? [];
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        this.notify.error('Error', err.error?.message || 'No se pudo cargar la información');
      }
    });
  }

  openClientDetail(client: BillingClientSummary): void {
    this.router.navigate(['/pos/billing/client', client.clientId], {
      queryParams: {
        from: this.dateFrom,
        to: this.dateTo,
        clientName: client.clientName,
        clientRfc: client.clientRfc
      }
    });
  }

  private firstDayOfMonth(): Date {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  }

  private getTodayDate(): Date {
    return new Date();
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
