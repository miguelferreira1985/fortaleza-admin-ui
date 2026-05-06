import { Injectable } from "@angular/core";
import { environment } from "../../../environments/environment";
import { HttpClient, HttpParams } from "@angular/common/http";
import { BillingClientDetail, BillingClientSummary, BillingItemDetail, FreeReturnRequest, PaymentMethod, SaleCancelRequest, SaleRequest, SaleResponse, SaleReturnRequest, SaleReturnResponse } from "../../shared/models/sale.models";
import { map, Observable } from "rxjs";
import { ApiResponse } from "../../shared/models/api-response";

@Injectable({ providedIn: 'root'})
export class SaleService {

  private apiUrl = environment.apiUrl;
  private path = '/sales';

  constructor(private http: HttpClient) {}

  createSale(request: SaleRequest): Observable<ApiResponse<SaleResponse>> {
    return this.http.post<ApiResponse<SaleResponse>>(`${this.apiUrl}${this.path}`, request);
  }

  getAll(): Observable<ApiResponse<SaleResponse[]>> {
    return this.http.get<ApiResponse<SaleResponse[]>>(`${this.apiUrl}${this.path}`);
  }

  getById(id: number): Observable<ApiResponse<SaleResponse>> {
    return this.http.get<ApiResponse<SaleResponse>>(`${this.apiUrl}${this.path}/${id}`)
;
  }

  getByFolio(folio: string): Observable<ApiResponse<SaleResponse>> {
    return this.http.get<ApiResponse<SaleResponse>>(`${this.apiUrl}${this.path}/folio/${folio}`);
  }

  getByClient(clientId: number): Observable<ApiResponse<SaleResponse[]>> {
    return this.http.get<ApiResponse<SaleResponse[]>>(`${this.apiUrl}${this.path}/client/${clientId}`);
  }

  getByClientToBeBilled(clientId: number): Observable<ApiResponse<SaleResponse[]>> {
    return this.http.get<ApiResponse<SaleResponse[]>>(`${this.apiUrl}${this.path}/client/${clientId}/to-bill`);
  }

  cancelSale(id: number, request: SaleCancelRequest): Observable<ApiResponse<SaleResponse>> {
    return this.http.put<ApiResponse<SaleResponse>>(`${this.apiUrl}${this.path}/${id}/cancel`, request);
  }

  // ── Devoluciones ──────────────────────────────────────────

  createReturn(saleId: number, request: SaleReturnRequest): Observable<ApiResponse<SaleReturnResponse>> {
    return this.http.post<ApiResponse<SaleReturnResponse>>(`${this.apiUrl}${this.path}/${saleId}/returns`, request);
  }

  getReturnsBySale(saleId: number): Observable<ApiResponse<SaleReturnResponse[]>> {
    return this.http.get<ApiResponse<SaleReturnResponse[]>>(`${this.apiUrl}${this.path}/${saleId}/returns`);
  }

  getReturnById(returnId: number): Observable<ApiResponse<SaleReturnResponse>> {
    return this.http.get<ApiResponse<SaleReturnResponse>>(`${this.apiUrl}${this.path}/returns/${returnId}`);
  }

  getAllReturns(): Observable<ApiResponse<SaleReturnResponse[]>> {
    return this.http.get<ApiResponse<SaleReturnResponse[]>>(`${this.apiUrl}${this.path}/returns`);
  }

  createFreeReturn(request: FreeReturnRequest): Observable<ApiResponse<SaleReturnResponse>> {
    return this.http.post<ApiResponse<SaleReturnResponse>>(`${this.apiUrl}${this.path}/returns/free`, request);
  }

  getBillingClients(from: string, to: string): Observable<ApiResponse<BillingClientSummary[]>> {
    const params = new HttpParams()
      .set('from', from)
      .set('to', to);
    return this.http.get<ApiResponse<BillingClientSummary[]>>(`${this.apiUrl}${this.path}/billing/clients`, { params });
  }

  getBillingClientDetails(clientId: number, from: string, to: string): Observable<ApiResponse<BillingClientDetail[]>> {
        const params = new HttpParams()
      .set('from', from)
      .set('to', to);
      return this.http.get<ApiResponse<BillingClientDetail[]>>(`${this.apiUrl}${this.path}/billing/clients/${clientId}/details`, { params });
  }

    getBillingItems(clientId: number, from: string, to: string, paymentMethod: PaymentMethod, saleId: number | null): Observable<ApiResponse<BillingItemDetail[]>> {
    let params = new HttpParams()
      .set('clientId', clientId.toString())
      .set('from', from)
      .set('to', to)
      .set('paymentMethod', paymentMethod);

    if (saleId !== null) {
      params = params.set('saleId', saleId.toString());
    }

    return this.http.get<ApiResponse<BillingItemDetail[]>>(`${this.apiUrl}${this.path}/billing/items`, { params });
  }

  getBillingSalesByClient(clientId: number, from: string, to: string): Observable<ApiResponse<SaleResponse[]>> {
    const params = new HttpParams().set('from', from).set('to', to);
    return this.http.get<ApiResponse<SaleResponse[]>>(`${this.apiUrl}${this.path}/client/${clientId}/to-bill`, { params });
  }

  toggleBillingFlag(saleId: number, toBeBilled: boolean): Observable<ApiResponse<SaleResponse>> {
    return this.http.patch<ApiResponse<SaleResponse>>(`${this.apiUrl}${this.path}/${saleId}/billing-flag`, { toBeBilled });
  }

}
