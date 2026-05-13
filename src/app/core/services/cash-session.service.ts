import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../shared/models/api-response';
import {
  CashSessionResponse,
  OpenCashSessionRequest,
  CloseCashSessionRequest,
  CashMovementRequest,
  CashMovementResponse,
  CashCutReport
} from '../../shared/models/cash-session.models';

@Injectable({ providedIn: 'root' })
export class CashSessionService {

  private apiUrl = environment.apiUrl;
  private path = '/cash-sessions';

  constructor(private http: HttpClient) {}

  openSession(request: OpenCashSessionRequest): Observable<ApiResponse<CashSessionResponse>> {
    return this.http.post<ApiResponse<CashSessionResponse>>(`${this.apiUrl}${this.path}/open`, request);
  }

  closeSession(id: number, request: CloseCashSessionRequest): Observable<ApiResponse<CashSessionResponse>> {
    return this.http.put<ApiResponse<CashSessionResponse>>(`${this.apiUrl}${this.path}/${id}/close`, request)
  }

  getActiveSession(): Observable<ApiResponse<CashSessionResponse>> {
    return this.http.get<ApiResponse<CashSessionResponse>>(`${this.apiUrl}${this.path}/active`);
  }

  getById(id: number): Observable<ApiResponse<CashSessionResponse>> {
    return this.http.get<ApiResponse<CashSessionResponse>>(`${this.apiUrl}${this.path}/${id}`);
  }

  getAll(): Observable<ApiResponse<CashSessionResponse[]>> {
    return this.http.get<ApiResponse<CashSessionResponse[]>>(`${this.apiUrl}${this.path}`);
  }

  getByEmployee(employeeId: number): Observable<ApiResponse<CashSessionResponse[]>> {
    return this.http.get<ApiResponse<CashSessionResponse[]>>(`${this.apiUrl}${this.path}/employee/${employeeId}`);
  }

  registerMovement(sessionId: number, request: CashMovementRequest): Observable<ApiResponse<CashMovementResponse>> {
    return this.http.post<ApiResponse<CashMovementResponse>>(`${this.apiUrl}${this.path}/${sessionId}/movements`, request);
  }

  getCutBySession(sessionId: number): Observable<ApiResponse<CashCutReport>> {
    return this.http.get<ApiResponse<CashCutReport>>(`${this.apiUrl}${this.path}/${sessionId}/cut`);
  }

  getCutByDay(date: string): Observable<ApiResponse<CashCutReport>> {
    const params = new HttpParams().set('date', date);
    return this.http.get<ApiResponse<CashCutReport>>(`${this.apiUrl}${this.path}/cut/daily`, { params })
  }

  getCutByEmployee(employeeId: number, from: string, to: string): Observable<ApiResponse<CashCutReport>> {
    const params = new HttpParams()
      .set('employeeId', employeeId.toString())
      .set('from', from)
      .set('to', to);

    return this.http.get<ApiResponse<CashCutReport>>(`${this.apiUrl}${this.path}/cut/employee`, { params })
  }
}
