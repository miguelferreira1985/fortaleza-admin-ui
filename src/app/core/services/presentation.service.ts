import { Injectable } from '@angular/core';
import { environment } from '../../../environment/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Presentation } from '../../shared/models/presentation';
import { ApiResponse } from '../../shared/models/api-response';

@Injectable({
  providedIn: 'root'
})
export class PresentationService {

  private apiUrl = environment.apiUrl;
  private apiPath = '/presentations';

  constructor(private http: HttpClient) {}

  getAllPresentations(): Observable<Presentation[]> {
    return this.http
      .get<ApiResponse<Presentation[]>>(`${this.apiUrl}${this.apiPath}`)
      .pipe(map(res => res.data));
  }

  createPresentation(presentation: Presentation): Observable<ApiResponse<Presentation>> {
    return this.http.post<ApiResponse<Presentation>>(`${this.apiUrl}${this.apiPath}`, presentation);
  }

  updatePresentation(id: number, presentation: Presentation): Observable<ApiResponse<Presentation>> {
    return this.http.put<ApiResponse<Presentation>>(`${this.apiUrl}${this.apiPath}/${id}`, presentation);
  }

  deletePresentation(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}${this.apiPath}/${id}`);
  }

}
