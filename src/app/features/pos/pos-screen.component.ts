import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../shared/material-module';
import { ProductService } from '../../core/services/product.service';
import { SaleService } from '../../core/services/sale.service';
import { CashSessionService } from '../../core/services/cash-session.service';
import { ClientService } from '../../core/services/client.service';
import { NotificationService } from '../../core/services/notification.service';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { CashSessionResponse } from '../../shared/models/cash-session.models';
import { Product } from '../../shared/models/product';
import { CartItem, CartPayment, PaymentMethod, SaleRequest, SaleResponse } from '../../shared/models/sale.models';
import { Client } from '../../shared/models/client';
import Swal from 'sweetalert2';
import { PaymentActivePipe } from '../../shared/pipes/payment-active.pipe';
import { CashMovementDialogComponent } from './cash-movement-dialog/cash-movement-dialog.component';
import { SaleReceiptDialogComponent } from './sale-receipt-dialog/sale-receipt-dialog.component';
import { HasRoleDirective } from '../../core/directives/has-role.directive';
import { CashCutReportDialogComponent } from './cash-cut-report-dialog.component/cash-cut-report-dialog.component';

@Component({
  selector: 'app-pps-screen.component',
  imports: [
    CommonModule,
    FormsModule,
    MaterialModule,
    CurrencyPipe,
    PaymentActivePipe,
    HasRoleDirective
  ],
  templateUrl: './pos-screen.component.html',
  styleUrl: './pos-screen.component.scss',
})
export class PosScreenComponent implements OnInit {

  private productService = inject(ProductService);
  private saleService = inject(SaleService);
  private cashService = inject(CashSessionService);
  private clientService = inject(ClientService);
  private notify = inject(NotificationService);
  private dialog = inject(MatDialog);
  private router = inject(Router);

  activeSession: CashSessionResponse | null = null;
  isLoadingSession = true;

  allProducts: Product[] = [];
  filteredProducts: Product[] = [];
  productSearch = '';
  isLoadingProducts = false;

  cart: CartItem[] = [];
  payments: CartPayment[] = [];

  allClients: Client[] = [];
  filteredClients: Client[] = [];
  clientSearch = '';
  selectedClient: Client | null = null;
  toBeBilled = false;

  cashReceived = 0;
  isSaving = false;

  readonly paymentMethods: PaymentMethod[] = ['EFECTIVO', 'TARJETA', 'TRANSFERENCIA'];

  get cartTotal(): number {
    return this.cart.reduce((acc, i) => acc + i.subtotal, 0);
  }

  get paymentsTotal(): number {
    return this.payments.reduce((acc, p) => acc + (p.amount || 0), 0);
  }

  get pendingAmount(): number {
    return Math.max(0, this.cartTotal - this.paymentsTotal);
  }

  get cashPayment(): CartPayment | undefined {
    return this.payments.find(p => p.paymentMethod === 'EFECTIVO');
  }

  get change(): number {
    if (!this.cashPayment) return 0;
    const overpaid = this.cashPayment.amount - (this.cartTotal - this.paymentsTotal + this.cashPayment.amount);
    return Math.max(0, this.cashPayment.amount - this.cartTotal +
      this.payments.filter(p => p.paymentMethod !== 'EFECTIVO').reduce((a, p) => a + (p.amount || 0), 0));
  }

  get isReadyToCharge(): boolean {
    if (this.cart.length === 0 || this.payments.length === 0) return false;
    if (Math.abs(this.paymentsTotal - this.cartTotal) > 0.01) return false;

    if (this.hasEfectivo) {
      const otherPayments = this.payments.filter(p => p.paymentMethod !== 'EFECTIVO').reduce((a, p) => a + (p.amount || 0), 0);
      const cashNeeded = this.cartTotal - otherPayments;

      if (this.cashReceived > 0 && this.cashReceived < cashNeeded) return false;
    }

    return true;
  }

  get hasEfectivo(): boolean { return this.payments.some(p => p.paymentMethod === 'EFECTIVO'); }
  get hasTarjeta(): boolean  { return this.payments.some(p => p.paymentMethod === 'TARJETA'); }
  get hasTransferencia(): boolean { return this.payments.some(p => p.paymentMethod === 'TRANSFERENCIA'); }

  ngOnInit(): void {
    this.checkActiveSession();
    this.loadClients();
  }

  checkActiveSession(): void {
    this.isLoadingSession = true;
    this.cashService.getActiveSession().subscribe({
      next: (res) => {
        this.activeSession = res.data;
        this.isLoadingSession = false;
        this.loadProducts();
      },
      error: (err) => {
        this.isLoadingSession = false;
        this.promptOpenSession();
      }
    });
  }

  promptOpenSession(): void {
    Swal.fire({
      title: '¿Con cuánto inicias la caja?',
      text: 'Ingresa el fondo inicial de efectivo',
      input: 'number',
      inputAttributes: { min: '0', step: '0.01', placeholder: '0.00' },
      inputLabel: 'Fondo inicial ($)',
      showCancelButton: true,
      confirmButtonColor: '#e91e63',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Abrir caja',
      cancelButtonText: 'Cancelar',
      allowOutsideClick: false,
      preConfirm: (value) => {
        if (!value || isNaN(Number(value)) || Number(value) < 0) {
          Swal.showValidationMessage('Ingresa un monto válido (puede ser $0)');
          return false;
        }
        return Number(value);
      }
    }).then(result => {
      if (result.isConfirmed) {
        this.cashService.openSession({ openingAmount: result.value }).subscribe({
          next: (res) => {
            this.activeSession = res.data;
            this.notify.success('¡Caja abierta!', `Fondo inicial: $${result.value}`);
            this.loadProducts();
          },
          error: err => {
            this.notify.error('Error', err.error?.message || 'No se pudo abrir la caja');
            this.router.navigate(['/dashboard']);
          }
        });
      } else {
        this.router.navigate(['/dashboard']);
      }
    });
  }

  openCloseSessionDialog(): void {
    Swal.fire({
      title: '¿Cerrar la caja?',
      text: 'Ingresa el efectivo que contaste físicamente',
      input: 'number',
      inputAttributes: { min: '0', step: '0.01', placeholder: '0.00' },
      inputLabel: 'Efectivo declarado ($)',
      showCancelButton: true,
      confirmButtonColor: '#e91e63',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Cerrar caja',
      cancelButtonText: 'Cancelar',
      preConfirm: (value) => {
        if (!value || isNaN(Number(value)) || Number(value) < 0) {
          Swal.showValidationMessage('Ingresa un monto válido');
          return false;
        }
        return Number(value);
      }
    }).then(result => {
      if (result.isConfirmed && this.activeSession) {
        this.cashService.closeSession(this.activeSession.id, {
          declaredCash: result.value
        }).subscribe({
          next: (res) => {
            const dialogRef = this.dialog.open(CashCutReportDialogComponent, {
              width: '500px',
              data: { session: res.data },
              disableClose: true,
              panelClass: 'cash-cut-dialog'
            });

            dialogRef.afterClosed().subscribe(() => {
              this.notify.success('¡Caja cerrada!', 'La sesión fue cerrada exitosamente');
              this.activeSession = null;
              this.router.navigate(['/dashboard']);
            });
          },
          error: err => this.notify.error('Error', err.error?.message)
        });
      }
    });
  }

  openMovementDialog(): void {
    if (!this.activeSession) return;
    this.dialog.open(CashMovementDialogComponent, {
      width: '420px',
      data: { sessionId: this.activeSession.id },
      disableClose: true
    }).afterClosed().subscribe(saved => {
      if (saved) this.notify.success('¡Guardado!', 'Movimiento registrado');
    });
  }

  loadProducts(): void {
    this.isLoadingProducts = true;
    this.productService.getProducts(true).subscribe({
      next: (data) => {
        this.allProducts = data;
        // Comentado hasta que se haya creado el inventario para permitir ventas de todos los productos
        //this.allProducts = data.filter(p => p.stock > 0);
        this.filteredProducts = [...this.allProducts];
        this.isLoadingProducts = false;
        this.productSearch = '';
      },
      error: () => { this.isLoadingProducts = false; }
    });
  }

  filterProducts(): void {
    const term = this.productSearch.toLowerCase().trim();

    this.filteredProducts = !term
      ? [...this.allProducts]
      : this.allProducts.filter(p =>
        p.name.toLowerCase().includes(term) ||
        p.code.toLowerCase().includes(term)
      );
  }

    addToCart(product: Product): void {
    const existing = this.cart.find(i => i.product.id === product.id);
    if (existing) {
      // Remover comentario cuando el inventario sea completado
      /*
      if (existing.quantity >= product.stock) {
        this.notify.warning('Stock insuficiente', `Solo hay ${product.stock} unidades disponibles`);
        return;
      }
      */
      existing.quantity++;
      this.recalculateItem(existing);
    } else {
      const item: CartItem = {
        product: {
          id: product.id!,
          name: product.name,
          code: product.code,
          price: product.price,
          stock: product.stock
        },
        quantity: 1,
        discount: 0,
        subtotal: product.price
      };
      this.cart.push(item);
    }
    this.recalculatePayments();
  }

  increaseQty(item: CartItem): void {

    // Remover cuando el inventario sea completado

    /*
    if (item.quantity >= item.product.stock) {
      this.notify.warning('Stock insuficiente', `Solo hay ${item.product.stock} disponibles`);
      return;
    }
    */
    item.quantity++;
    this.recalculateItem(item);
    this.recalculatePayments();
  }

  decreaseQty(item: CartItem): void {
    if (item.quantity <= 1) {
      this.removeFromCart(item);
      return;
    }
    item.quantity--;
    this.recalculateItem(item);
    this.recalculatePayments();
  }

  onQtyChange(item: CartItem): void {
    if (!item.quantity || item.quantity < 1) item.quantity = 1;
    if (item.quantity > item.product.stock) item.quantity = item.product.stock;
    this.recalculateItem(item);
    this.recalculatePayments();
  }

  onDiscountChange(item: CartItem): void {
    if (!item.discount || item.discount < 0) item.discount = 0;
    if (item.discount > 100) item.discount = 100;
    this.recalculateItem(item);
    this.recalculatePayments();
  }

  removeFromCart(item: CartItem): void {
    this.cart = this.cart.filter(i => i !== item);

    if (this.cart.length === 0) {
      this.payments = [];
      this.cashReceived = 0;
    } else {
    this.recalculatePayments();
    }
  }

  clearCart(): void {
    this.cart = [];
    this.payments = [];
    this.cashReceived = 0;
    this.selectedClient = null;
    this.clientSearch = '';
    this.toBeBilled = false;
  }

    private recalculateItem(item: CartItem): void {
    const factor = 1 - (item.discount || 0) / 100;
    item.subtotal = Math.round(item.product.price * item.quantity * factor * 100) / 100;
  }

  togglePaymentMethod(method: PaymentMethod): void {
    const existing = this.payments.find(p => p.paymentMethod === method);

    if (existing) {
      this.payments = this.payments.filter(p => p.paymentMethod !== method);
    } else {
      const amount = this.payments.length === 0 ? this.cartTotal : 0;
      this.payments.push({ paymentMethod: method, amount });
    }
    this.cashReceived = 0;
    this.recalculatePayments();
  }

  onPaymentAmountChange(payment: CartPayment): void {
    if (!payment.amount || payment.amount < 0) payment.amount = 0;
    if (this.payments.length === 1) {
      payment.amount = this.cartTotal;
    }
  }

  setExactAmount(payment: CartPayment): void {
    payment.amount = this.pendingAmount + payment.amount;
  }

  private recalculatePayments(): void {
    if (this.payments.length === 1) {
      this.payments[0].amount = this.cartTotal;
    }
  }

  getChange(): number {
    if (!this.hasEfectivo) return 0;
    const otherPayments = this.payments.filter(p => p.paymentMethod !== 'EFECTIVO').reduce((a, p) => a + (p.amount || 0), 0);
    const cashNeeded = this.cartTotal - otherPayments;
    return Math.max(0, this.cashReceived - cashNeeded);
  }

  loadClients(): void {
    this.clientService.getClients().subscribe({
      next: (data) => {
        this.allClients = data;
        this.filteredClients = data;
      }
    });
  }

  filterClients(): void {
    const term = this.clientSearch.toLowerCase().trim();
    this.filteredClients = !term
      ? [...this.allClients]
      : this.allClients.filter(c => c.name.toLowerCase().includes(term));
  }

  selectClient(client: Client): void {
    this.selectedClient = client;
    this.clientSearch = client.name;
  }

  clearClient(): void {
    this.selectedClient = null;
    this.clientSearch = '';
    this.toBeBilled = false;
  }

  async charge(): Promise<void> {
    if (!this.isReadyToCharge) return;

    const cashPayment = this.payments.find(p => p.paymentMethod === 'EFECTIVO');
    const otherTotal = this.payments.filter(p => p.paymentMethod !== 'EFECTIVO').reduce((a, p) => a + (p.amount || 0), 0);
    const cashNeeded = this.cartTotal - otherTotal;
    const cashReceivedDisplay = this.cashReceived > 0 ? this.cashReceived : cashNeeded;
    const change = cashPayment ? Math.max(0, cashReceivedDisplay - cashNeeded) : 0;
    const paymentsHTML = this.payments.length > 1
      ? this.payments.map(p => `
          <div class="swal-row">
            <span>${this.getPaymentLabel(p.paymentMethod)}</span>
            <strong>$${p.amount.toFixed(2)}</strong>
          </div>`).join('')
      : '';
    const cashHTML = cashPayment ? `
      <div class="swal-row cash-row">
        <span>Efectivo recibido</span>
        <strong>$${cashReceivedDisplay.toFixed(2)}</strong>
      </div>
      ${change > 0 ? `
      <div class="swal-row change-row">
        <span>💵 Cambio a entregar</span>
        <strong>$${change.toFixed(2)}</strong>
      </div>` : ''}
    ` : '';

    const { isConfirmed } = await Swal.fire({
      title: '¿Confirmar cobro?',
      html: `
        <style>
          .swal-detail { text-align: left; margin-top: 12px; }
          .swal-row {
            display: flex; justify-content: space-between;
            padding: 6px 0; font-size: 0.95rem; color: #555;
            border-bottom: 1px solid #f0f0f0;
          }
          .swal-row:last-child { border-bottom: none; }
          .swal-total {
            display: flex; justify-content: space-between; align-items: center;
            padding: 10px 0 4px; font-size: 1.1rem; font-weight: 700; color: #333;
            border-top: 2px solid #f8bbd0; margin-top: 4px;
          }
          .swal-total strong { font-size: 1.3rem; color: #880e4f; }
          .cash-row { color: #1565c0; font-weight: 500; }
          .change-row {
            color: #2e7d32; font-weight: 700; font-size: 1rem !important;
            background: #e8f5e9; border-radius: 6px;
            padding: 8px 10px !important; margin-top: 4px;
            border-bottom: none !important;
          }
          .swal-divider { border: none; border-top: 1px dashed #e0e0e0; margin: 6px 0; }
        </style>
        <div class="swal-detail">
          ${paymentsHTML ? paymentsHTML + '<hr class="swal-divider">' : ''}
          ${cashHTML}
          <div class="swal-total">
            <span>TOTAL</span>
            <strong>$${this.cartTotal.toFixed(2)}</strong>
          </div>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#e91e63',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, cobrar',
      cancelButtonText: 'Revisar',
      reverseButtons: true
    });

    if (!isConfirmed) return;

    this.isSaving = true;

    const request: SaleRequest = {
      clientId: this.selectedClient?.id ?? null,
      toBeBilled: this.toBeBilled,
      items: this.cart.map(i => ({
        productId: i.product.id,
        quantity: i.quantity,
        discount: i.discount
      })),
      payments: this.payments
    };

    this.saleService.createSale(request).subscribe({
      next: (res) => {
        this.isSaving = false;
        this.clearCart();
        this.loadProducts(); // Actualizar stocks en pantalla
        this.openReceipt(res.data);
      },
      error: (err) => {
        this.isSaving = false;
        this.notify.error('Error al cobrar', err.error?.message || 'No se pudo registrar la venta');
      }
    });
  }

  openReceipt(sale: SaleResponse): void {
    this.dialog.open(SaleReceiptDialogComponent, {
      width: '420px',
      data: { sale },
      panelClass: 'receipt-dialog'
    });
  }

  trackByProductId(_: number, p: Product): number { return p.id!; }
  trackByCartItem(_: number, i: CartItem): number { return i.product.id; }

  getPaymentLabel(method: PaymentMethod): string {
    const labels: Record<PaymentMethod, string> = {
      EFECTIVO: 'Efectivo', TARJETA: 'Tarjeta', TRANSFERENCIA: 'Transferencia'
    };
    return labels[method];
  }

  getPaymentIcon(method: PaymentMethod): string {
    const icons: Record<PaymentMethod, string> = {
      EFECTIVO: 'payments', TARJETA: 'credit_card', TRANSFERENCIA: 'account_balance'
    };
    return icons[method];
  }

  goToSales(): void {
    this.router.navigate(['/pos/sales']);
  }

  goToReturns(): void {
    this.router.navigate(['/pos/returns']);
  }

}
