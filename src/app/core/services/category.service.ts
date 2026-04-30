import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Category } from '../../shared/models/category';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../shared/models/api-response';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {

  private apiUrl = environment.apiUrl;
  private apiPath = '/categories';

  constructor(private http: HttpClient) {}

  getAllCategories(): Observable<Category[]> {
    return this.http
      .get<ApiResponse<Category[]>>(`${this.apiUrl}${this.apiPath}`)
      .pipe(map(res => res.data));
  }

  createCategory(category: Category): Observable<ApiResponse<Category>> {
    return this.http.post<ApiResponse<Category>>(`${this.apiUrl}${this.apiPath}`, category);
  }

  updateCategory(id: number, category: Category): Observable<ApiResponse<Category>> {
    return this.http.put<ApiResponse<Category>>(`${this.apiUrl}${this.apiPath}/${id}`, category);
  }

  deleteCategory(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}${this.apiPath}/${id}`);
  }

  countCategories(): Observable<ApiResponse<number>> {
    return this.http.get<ApiResponse<number>>(`${this.apiUrl}${this.apiPath}/count`);
  }

}
