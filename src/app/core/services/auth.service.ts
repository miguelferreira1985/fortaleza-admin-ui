import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../environment/environment';
import { AuthTokens } from '../../shared/models/auth-tokens';
import { ApiResponse } from '../../shared/models/api-response';
import { map, tap } from 'rxjs/operators';
import { jwtDecode } from 'jwt-decode';
import { CurrentUser } from '../../shared/models/current-user';

interface JwtPayload {
  sub: string;
  role: string[];
  exp: number;
  firstName: string;
  lastName: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private apiUrl = `${environment.apiUrl}/auth`;

  constructor(private http: HttpClient, private router: Router) {}

  login(username: string, password: string): Observable<AuthTokens> {
    this.clearIfExpired();
    return this.http
      .post<ApiResponse<AuthTokens>>(`${this.apiUrl}/login`, { username, password })
      .pipe(
        map((res) => res.data),
        tap((tokens) => this.storeTokens(tokens))
      );
  }

  refresh(): Observable<string> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken || this.isTokenExpired(refreshToken)) {
      this.logout();
      return throwError(() => new Error("Refresh token missing or expired"));
    }
    return this.http
      .post<ApiResponse<AuthTokens>>(`${this.apiUrl}/refresh`, { refreshToken })
      .pipe(
        map((res) => res.data),
        tap((tokens) => this.storeTokens(tokens)),
        map((tokens) => tokens.token)
      );
  }

  getAccessToken(): string | null {
    return sessionStorage.getItem('accessToken');
  }

  getRefreshToken(): string | null {
    return sessionStorage.getItem('refreshToken');
  }

  isAuthenticated(): boolean {
    const token = this.getAccessToken();
    return !!token && !this.isTokenExpired(token);
  }

  getUserRoles(): string[] {
    const token = this.getAccessToken();
    if (!token) return [];

    try {
      const decode = jwtDecode<JwtPayload>(token);
      return decode.role || [];
    } catch (e) {
      console.error('Error decoding JWT', e);
      return [];
    }
  }

  hasRole(role: string): boolean {
    return this.getUserRoles().includes(role);
  }

  getCurrentUser(): CurrentUser | null {
    const token = this.getAccessToken();
    if (!token) return null;

    try {
      const decoded = jwtDecode<JwtPayload>(token);
      const firstName = decoded.firstName || '';
      const lastName = decoded.lastName || '';

      return {
        username: decoded.sub,
        firstName,
        lastName,
        fullName: `${firstName} ${lastName}`.trim(),
        initials: this.buildInitials(firstName, lastName),
        roles: decoded.role || []
      };
    } catch (e) {
      console.error('Error decoding JWT', e);
      return null;
    }

  }

 logout(): void {
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('refreshToken');
    this.router.navigate(['/login']);
  }

  clearIfExpired(): void {
    const accessToken = this.getAccessToken();
    const refreshToken = this.getRefreshToken();
    if ((accessToken && this.isTokenExpired(accessToken)) || (refreshToken && this.isTokenExpired(refreshToken))) {
      this.logout();
    }
  }

  private storeTokens(tokens: AuthTokens): void {
    sessionStorage.setItem('accessToken', tokens.token);
    sessionStorage.setItem('refreshToken', tokens.refreshToken);
  }

  private isTokenExpired(token: string): boolean {
    try {
      const { exp } = jwtDecode<JwtPayload>(token);
      if (!exp) return true;
      const nowSec = Math.floor(Date.now() / 1000);
      return exp <= nowSec;
    } catch {
      return true;
    }
  }

  private buildInitials(firstName: string, lastName: string): string {
    const f = firstName?.charAt(0)?.toUpperCase() || '';
    const l = lastName?.charAt(0)?.toUpperCase() || '';

    return `${f}${l}` || '??';
  }
}
