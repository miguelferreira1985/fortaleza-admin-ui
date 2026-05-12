import { HttpErrorResponse, HttpInterceptorFn } from "@angular/common/http";
import { inject } from "@angular/core";
import { NotificationService } from "../services/notification.service";
import { catchError, throwError } from "rxjs";

type ApiErrorResponse = {
    timestamp?: string,
    status?: number,
    message?: string,
    errors?: Record<string, string[]> | string[] | string;

};

function extractValidationMessages(errors: ApiErrorResponse['errors']): string {
    if (!errors) return '';
    if (Array.isArray(errors)) return errors.join(', ');
    if (typeof errors === 'string') return errors;
    return Object.entries(errors)
        .map(([field, msgs]) => Array.isArray(msgs) ? `${field}: ${msgs.join(': ')}` : `${field}: ${msgs}`)
        .join(', ');
}

function toFriendlyMessage(err: HttpErrorResponse): string {
    if (err.status === 0) return 'No se pudo conectar al servidor. Verificatu tu conexión o el CORS del backend.';

    const api: ApiErrorResponse | undefined = err.error;

    const apiMsg = api?.message ?? (typeof err.error === 'string' ? err.error : null);

  switch (err.status) {
    case 400: {
      const details = extractValidationMessages(api?.errors);
      return details ? `Validación: ${details}` : (apiMsg ?? 'Solicitud inválida (400).');
    }
    case 401:
      return apiMsg ?? 'Sesión inválida o expirada. Vuelve a iniciar sesión.';
    case 403:
      return apiMsg ?? 'No tienes permisos para esta acción (403).';
    case 404:
      return apiMsg ?? 'Recurso no encontrado (404).';
    case 409:
      return apiMsg ?? 'Conflicto de datos (409).';
    case 422: {
      const details = extractValidationMessages(api?.errors);
      return details ? `Validación: ${details}` : (apiMsg ?? 'Datos no procesables (422).');
    }
    case 429:
      return apiMsg ?? 'Demasiadas solicitudes. Espera un momento e intenta de nuevo.';
    case 500:
      return apiMsg ?? 'Ocurrió un error en el servidor (500).';
    default:
      return apiMsg ?? `Error inesperado (${err.status}).`;
  }
}

export const errorInterceptor: HttpInterceptorFn = ((req, next) => {
    const notify = inject(NotificationService);

    return next(req).pipe(
        catchError((err: HttpErrorResponse) => {
            const friendlyMessage = toFriendlyMessage(err);

            if (err.status !== 401) {
                notify.error(err.error.message, err.error.errors);
            }

            const enhaced = Object.assign(err, { friendlyMessage });
            return throwError(() => enhaced);
        })
    )
})
