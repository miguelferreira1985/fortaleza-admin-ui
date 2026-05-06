import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../../shared/material-module';
import { HasRoleDirective } from '../../../core/directives/has-role.directive';
import { SaleService } from '../../../core/services/sale.service';
import { NotificationService } from '../../../core/services/notification.service';
import { BillingClientSummary, SaleResponse } from '../../../shared/models/sale.models';
import { Router, RouterLink } from '@angular/router';

type BillingView = 'LIST' | 'DETAIL';

@Component({
  selector: 'app-billing-dashboard.component',
  imports: [
    CommonModule,
    FormsModule,
    MaterialModule,
    HasRoleDirective,
    CurrencyPipe,
    DatePipe,
    RouterLink
  ],
  templateUrl: './billing-dashboard.component.html',
  styleUrl: './billing-dashboard.component.scss',
})
export class BillingDashboardComponent implements OnInit {

  private saleService = inject(SaleService);
  private notify = inject(NotificationService);

  view: BillingView = 'LIST';
  selectedClient: BillingClientSummary | null = null;

  dateFrom = this.firstDayOfMonth();
  dateTo = this.toDateString(new Date());

  clients: BillingClientSummary[] = [];
  isLoadingClients = false;

  clientSales: SaleResponse[] = [];
  isLoadingSales = false;

  get cashSales(): SaleResponse[] {
    return this.clientSales.filter(
      s => s.payments.some(p => p.paymentMethod === 'TRANSFERENCIA') && !s.payments.some(p => p.paymentMethod === 'EFECTIVO'));
  }

  get cardSales(): SaleResponse[] {
    return this.clientSales.filter(s => s.payments.some(p => p.paymentMethod === 'TARJETA') && !s.payments.some(p => p.paymentMethod === 'EFECTIVO'));
  }

  get transferSales(): SaleResponse[] {
    return this.clientSales.filter(
      s => s.payments.some(p => p.paymentMethod === 'TRANSFERENCIA') && !s.payments.some(p => p.paymentMethod === 'EFECTIVO'));
  }

  get cashTotal(): number {
    return this.clientSales
      .flatMap(s => s.payments)
      .filter(p => p.paymentMethod === 'EFECTIVO')
      .reduce((a, p) => a + p.amount, 0);
  }

  get cardTotal(): number {
    return this.clientSales
      .flatMap(s => s.payments)
      .filter(p => p.paymentMethod === 'TARJETA')
      .reduce((a, p) => a + p.amount, 0);
  }

  get transferTotal(): number {
    return this.clientSales
      .flatMap(s => s.payments)
      .filter(p => p.paymentMethod === 'TRANSFERENCIA')
      .reduce((a, p) => a + p.amount, 0);
  }

  ngOnInit(): void {
    this.loadClients();
  }

  loadClients(): void {
    this.isLoadingClients = true;
    this.saleService.getBillingClients(this.dateFrom, this.dateTo).subscribe({
      next: (res) => {
        this.clients = res.data ?? [];
        this.isLoadingClients = false;
      },
      error: (err) => {
        this.isLoadingClients = false;
        this.notify.error('Error', err.error?.message || 'No se pudo cargar la información');
      }
    });
  }

  openClientDetail(client: BillingClientSummary): void {
    this.selectedClient = client;
    this.view = 'DETAIL';
    this.loadClientSales(client.clientId);
  }

  goBackToList(): void {
    this.view = 'LIST';
    this.selectedClient = null;
    this.clientSales = [];
  }

  loadClientSales(clientId: number): void {
    this.isLoadingSales = true;
    this.saleService.getBillingSalesByClient(clientId, this.dateFrom, this.dateTo).subscribe({
      next: (res) => {
        this.clientSales = res.data ?? [];
        this.isLoadingSales = false;
      },
      error: () => { this.isLoadingSales = false; }
    });
  }

  toggleBillingFlag(sale: SaleResponse): void {
    const newValue = !sale.toBeBilled;
    this.saleService.toggleBillingFlag(sale.id, newValue).subscribe({
      next: (res) => {
        sale.toBeBilled = res.data.toBeBilled;
        if (!newValue) {
          this.clientSales = this.clientSales.filter(s => s.id !== sale.id);
        }
      },
      error: err => this.notify.error('Error', err.error?.message)
    });
  }

  printCashReport(): void {
    window.print();
  }

  printSaleTicket(saleId: number): void {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <script>
          window.onload = function() {
            window.print();
            window.close();
          }
        </script>
        <p>Venta #${saleId} — imprimir desde el detalle de la venta</p>
      `);
    }
  }

  // ── Helpers ───────────────────────────────────────────────

  getPaymentAmount(sale: SaleResponse, method: string): number {
    return sale.payments
      .filter(p => p.paymentMethod === method)
      .reduce((a, p) => a + p.amount, 0);
  }

  private firstDayOfMonth(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  }

  private toDateString(date: Date): string {
    return date.toISOString().split('T')[0];
  }

}
