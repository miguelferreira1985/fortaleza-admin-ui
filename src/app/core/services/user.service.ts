import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { User } from '../../shared/models/user';
import { ApiResponse } from '../../shared/models/api-response';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { ChangePasswordRequestDto } from '../../shared/models/change-password-request-dto';
import { UpdateRolesRequestDto } from '../../shared/models/update-roles-requets-dto';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private apiUrl = environment.apiUrl;
  private apiPath = '/users';

  constructor(private http: HttpClient) {}

  getUsers(): Observable<User[]> {
    return this.http
      .get<ApiResponse<User[]>>(`${this.apiUrl}${this.apiPath}`).pipe(map(res => res.data));
  }

  activateUser(id: number): Observable<User> {
    return this.http.patch<User>(`${this.apiUrl}${this.apiPath}/${id}/activate`, null);
  }

  desactivateUser(id: number): Observable<User> {
    return this.http.patch<User>(`${this.apiUrl}${this.apiPath}/${id}/deactivate`, null);
  }

  unblockUser(id: number): Observable<User> {
    return this.http.patch<User>(`${this.apiUrl}${this.apiPath}/${id}/unblock`, null);
  }

  changePassword(id: number, changePasswordRequestDto: ChangePasswordRequestDto): Observable<User> {
    console.log('request de servicio', changePasswordRequestDto);
    return this.http.patch<User>(`${this.apiUrl}${this.apiPath}/${id}/password`, changePasswordRequestDto);
  }

  updateRoles(id: number, updateRolesRequestDto: UpdateRolesRequestDto): Observable<User> {
    return this.http.patch<User>(`${this.apiUrl}${this.apiPath}/${id}/roles`, updateRolesRequestDto);
  }

  deleteUser(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}${this.apiPath}/${id}`);
  }

}
