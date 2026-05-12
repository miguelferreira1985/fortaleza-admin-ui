import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { PurchaseOrder, PurchaseOrderDetail, PurchaseOrderRequest, PurchaseOrderStatusUpdateRequestDTO, PurchaseOrderUpdateRequestDTO } from '../../shared/models/purchase-order.models';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../shared/models/api-response';

@Injectable({
  providedIn: 'root'
})
export class PurchaseOrderService {

  private readonly baseUrl = `${environment.apiUrl}/purchase-orders`;

  constructor(private http: HttpClient) {}

  createOrder(request: PurchaseOrderRequest): Observable<ApiResponse<PurchaseOrder>> {
    return this.http.post<ApiResponse<PurchaseOrder>>(this.baseUrl, request);
  }

  getById(orderId: number): Observable<ApiResponse<PurchaseOrderDetail>> {
    return this.http.get<ApiResponse<PurchaseOrderDetail>>(`${this.baseUrl}/${orderId}`);
  }

  getBySupplier(supplierId: number): Observable<ApiResponse<PurchaseOrder[]>> {
    return this.http.get<ApiResponse<PurchaseOrder[]>>(`${this.baseUrl}/by-supplier/${supplierId}`);
  }

  updateOrder(orderId: number, request: PurchaseOrderUpdateRequestDTO): Observable<ApiResponse<PurchaseOrder[]>> {
    return this.http.put<ApiResponse<PurchaseOrder[]>>(`${this.baseUrl}/${orderId}`, request);
  }

  updateStatus(orderId: number, request: PurchaseOrderStatusUpdateRequestDTO): Observable<ApiResponse<PurchaseOrder>> {
    return this.http.put<ApiResponse<PurchaseOrder>>(`${this.baseUrl}/${orderId}/status`, request);
  }

  updateOldOrder(id: number, dto: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/${id}`, dto);
  }

  countByStatus(status: string): Observable<ApiResponse<number>> {
    return this.http.get<ApiResponse<number>>(`${this.baseUrl}/count?status=${status}`);
  }

  downloadPurchaseOrderPdf(orderId: number, templateName: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/${orderId}/pdf/${templateName}`,
      {
        responseType: 'blob'
      }
    );
  }

}
