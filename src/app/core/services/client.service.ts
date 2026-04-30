import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Client } from '../../shared/models/client';
import { ApiResponse } from '../../shared/models/api-response';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ClientService {

  private apiUrl = environment.apiUrl;
  private apiPath = '/clients';

  constructor(private http: HttpClient) {}

  getClients(isActivate?: boolean): Observable<Client[]> {
    let params = new HttpParams();
    if (isActivate !== undefined) {
      params = params.set('isActivate', isActivate.toString());
    }
    return this.http
      .get<ApiResponse<Client[]>>(`${this.apiUrl}${this.apiPath}`, { params })
      .pipe(map(res => res.data));
  }

  createClient(client: Client): Observable<ApiResponse<Client>> {
    return this.http.post<ApiResponse<Client>>(`${this.apiUrl}${this.apiPath}`, client);
  }

  updateClient(id: number, client: Client): Observable<ApiResponse<Client>> {
    return this.http.put<ApiResponse<Client>>(`${this.apiUrl}${this.apiPath}/${id}`, client);
  }

  deactivateClient(id: number): Observable<ApiResponse<Client>> {
    return this.http.patch<ApiResponse<Client>>(`${this.apiUrl}${this.apiPath}/${id}/deactivate`, null);
  }

  activateClient(id: number): Observable<ApiResponse<Client>> {
    return this.http.patch<ApiResponse<Client>>(`${this.apiUrl}${this.apiPath}/${id}/activate`, null);
  }

  countActiveClients(): Observable<ApiResponse<number>> {
    return this.http.get<ApiResponse<number>>(`${this.apiUrl}${this.apiPath}/count/active`);
  }

}
