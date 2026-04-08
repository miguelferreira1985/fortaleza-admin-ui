import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Employee } from '../../shared/models/employee';
import { ApiResponse } from '../../shared/models/api-response';
import { map } from 'rxjs/operators';
import { EmployeeRequestDto } from '../../shared/models/employee-request-dto';
import { UserRequestDto } from '../../shared/models/user-request-dto';

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {

  private apiUrl = environment.apiUrl;
  private apiPath = '/employees';

  constructor(private http: HttpClient) {}

  getEmployees(isActivate?: boolean): Observable<Employee[]> {
    let params = new HttpParams();
    if (isActivate !== undefined) {
      params = params.set('isActivate', isActivate.toString());
    }
    return this.http
      .get<ApiResponse<Employee[]>>(`${this.apiUrl}${this.apiPath}`, { params })
      .pipe(map(res => res.data));
  }

  createEmployee(employeeRequestDto: EmployeeRequestDto): Observable<ApiResponse<Employee>> {
    return this.http.post<ApiResponse<Employee>>(`${this.apiUrl}${this.apiPath}`, employeeRequestDto);
  }

  updateEmployee(id: number, employeeRequestDto: EmployeeRequestDto): Observable<ApiResponse<Employee>> {
    return this.http.put<ApiResponse<Employee>>(`${this.apiUrl}${this.apiPath}/${id}`, employeeRequestDto);
  }

  deleteEmployee(id: number): Observable<Employee> {
    return this.http.patch<Employee>(`${this.apiUrl}${this.apiPath}/${id}/deactivate`, null);
  }

  createUserForEmployee(id: number, userRequestDTO: UserRequestDto): Observable<ApiResponse<Employee>> {
    return this.http.put<ApiResponse<Employee>>(`${this.apiUrl}${this.apiPath}/${id}/user`, userRequestDTO);
  }

}
