import { Injectable } from '@angular/core';
import { environment } from '../../../environment/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Supplier } from '../../shared/models/supplier';
import { ApiResponse } from '../../shared/models/api-response';
import { Product } from '../../shared/models/product';

@Injectable({
  providedIn: 'root'
})
export class SupplierService {

  private apiUrl = environment.apiUrl;
  private apiPath = "/suppliers";

  constructor(private http: HttpClient) {}

  getSuppliers(isActivate?: boolean): Observable<Supplier[]> {
    let params = new HttpParams();
    if (isActivate !== undefined) {
      params = params.set('isActivate', isActivate.toString());
    }
    return this.http
      .get<ApiResponse<Supplier[]>>(`${this.apiUrl}${this.apiPath}`, { params })
      .pipe(map(res => res.data));
  }

  createSupplier(supplier: Supplier): Observable<ApiResponse<Supplier>> {
    return this.http.post<ApiResponse<Supplier>>(`${this.apiUrl}${this.apiPath}`, supplier);
  }

  updateSupplier(id: number, supplier: Supplier): Observable<ApiResponse<Supplier>> {
    return this.http.put<ApiResponse<Supplier>>(`${this.apiUrl}${this.apiPath}/${id}`, supplier);
  }

  deleteSupplier(id: number): Observable<ApiResponse<Supplier>> {
    return this.http.patch<ApiResponse<Supplier>>(`${this.apiUrl}${this.apiPath}/${id}/deactivate`, null);
  }

  getProductsBySupplier(id: number, isActivate?: boolean): Observable<ApiResponse<Product[]>> {
    let params = new HttpParams();
    if (isActivate !== undefined) {
      params = params.set('isActivate', isActivate.toString());
    }
    return this.http
      .get<ApiResponse<Product[]>>(`${this.apiUrl}${this.apiPath}/${id}/products`, { params });
  }

}
