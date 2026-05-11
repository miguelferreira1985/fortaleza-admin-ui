import { Pipe, PipeTransform } from '@angular/core';
import { CartPayment, PaymentMethod } from '../models/sale.models';

@Pipe({ name: 'paymentActive', standalone: true, pure: false })
export class PaymentActivePipe implements PipeTransform {
  transform(payments: CartPayment[], method: PaymentMethod): boolean {
    return payments.some(p => p.paymentMethod === method);
  }
}
