import { Injectable } from '@angular/core';
import { environment } from '../../../environment/environment';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { ApiResponse } from '../../shared/models/api-response';
import { InventoryMovement } from '../../shared/models/inventory-movement';

@Injectable({
  providedIn: 'root'
})
export class InventoryMovementService {

  private apiUrl = environment.apiUrl;
  private apiPath = '/inventory-movements';

  constructor(private http: HttpClient) {}

  getByProduct(id: number): Observable<ApiResponse<InventoryMovement[]>> {
    return this.http.get<ApiResponse<InventoryMovement[]>>(`${this.apiUrl}${this.apiPath}/product/${id}`);
  }

  getDevolutionsAndAdujustments(): Observable<ApiResponse<InventoryMovement[]>> {
    return this.http.get<ApiResponse<InventoryMovement[]>>(`${this.apiUrl}${this.apiPath}/devolutions-adjustments`);
  }

}
