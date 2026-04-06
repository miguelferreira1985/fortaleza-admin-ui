import { Injectable } from '@angular/core';
import { environment } from '../../../environment/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Product } from '../../shared/models/product';
import { map } from 'rxjs/operators';
import { ProductRequestDto } from '../../shared/models/product-request-dto';
import { ApiResponse } from '../../shared/models/api-response';
import { StokcRequestDto } from '../../shared/models/stock-request-dto';
import { InventoryMovement } from '../../shared/models/inventory-movement';

@Injectable({
  providedIn: 'root'
})
export class ProductService {

  private apiUrl = environment.apiUrl;
  private apiPath = '/products';

  constructor(private http: HttpClient) {}

    getProducts(isActivate?: boolean): Observable<Product[]> {
      let params = new HttpParams();
      if (isActivate !== undefined) {
        params = params.set('isActivate', isActivate.toString());
      }
      return this.http
        .get<ApiResponse<Product[]>>(`${this.apiUrl}${this.apiPath}`, { params })
        .pipe(map(res => res.data));
    }

    getInventoryValue(): Observable<number> {
      return this.http.get<number>(`${this.apiUrl}${this.apiPath}/inventory-value`);
    }

    getLowStock(): Observable<Product[]> {
      return this.http.get<Product[]>(`${this.apiUrl}${this.apiPath}/low-stock`);
    }

    createProduct(productRequestDto: ProductRequestDto): Observable<ApiResponse<Product>> {
      return this.http.post<ApiResponse<Product>>(`${this.apiUrl}${this.apiPath}`, productRequestDto);
    }

    updateProduct(id: number, productRequestDto: ProductRequestDto): Observable<ApiResponse<Product>> {
      return this.http.put<ApiResponse<Product>>(`${this.apiUrl}${this.apiPath}/${id}`, productRequestDto);
    }

    activateProduct(id: number): Observable<Product> {
      return this.http.patch<Product>(`${this.apiUrl}${this.apiPath}/${id}/activate`, null);
    }

    desactivateProduct(id: number): Observable<Product> {
      return this.http.patch<Product>(`${this.apiUrl}${this.apiPath}/${id}/desactivate`, null);
    }

    updateStock(id: number, stockRequestDto: StokcRequestDto): Observable<ApiResponse<Product>> {
      return this.http.patch<ApiResponse<Product>>(`${this.apiUrl}${this.apiPath}/${id}/stock`, stockRequestDto);
    }

}
