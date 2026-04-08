import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { environment } from '../../../environment/environment';
import { BehaviorSubject, catchError, filter, switchMap, throwError, take } from 'rxjs';

const AUTH_BASE = `${environment.apiUrl}/auth`;
const LOGIN_URL = `${AUTH_BASE}/login`;
const REFRESH_URL = `${AUTH_BASE}/refresh`;

let isRefreshing = false;
const refreshToken$ = new BehaviorSubject<string | null>(null);

const isAuthEndpoint = (url: string) => url.startsWith(AUTH_BASE);

const withAuth = (req: any, token: string) =>
  req.clone({ setHeaders: { Authorization: `Bearer ${token}`} });

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.getAccessToken();

  const reqToSend = token && !isAuthEndpoint(req.url) ? withAuth(req, token): req;

  return next(reqToSend).pipe(
    catchError((err: HttpErrorResponse) => {
      if (isAuthEndpoint(req.url) || err.status !== 401) {
        return throwError(() => err);
      }

      const refresh = auth.getRefreshToken();
      if (!refresh) {
        auth.logout()
        return throwError(() => err);
      }

      if (isRefreshing) {
        return refreshToken$.pipe(
          filter((t): t is string => t !== null),
          take(1),
          switchMap((newAccess) => next(withAuth(req, newAccess)))
        );
      }

      isRefreshing = true;
      refreshToken$.next(null);

      return auth.refresh().pipe(
        switchMap((newAccess) => {
          isRefreshing = false;
          refreshToken$.next(newAccess);
          return next(withAuth(req, newAccess));
        }),
        catchError((refreshErr) => {
          isRefreshing = false;
          auth.logout();
          return throwError(() => refreshErr);
        })
      )
    })
  )
};
