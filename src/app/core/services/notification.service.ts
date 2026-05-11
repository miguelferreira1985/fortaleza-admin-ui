import { Injectable } from "@angular/core";
import Swal, { SweetAlertIcon } from "sweetalert2";

@Injectable({ providedIn: 'root'})
export class NotificationService {

  show(icon: SweetAlertIcon, title: string, message: string): void {
    Swal.fire({
      icon,
      title,
      text: message,
      confirmButtonColor: '#e91e63',
      confirmButtonText: 'Entendido'
    });
  }

  success(title: string, message: string): void { this.show('success', title, message); }
  warning(title: string, message: string): void { this.show('warning', title, message); }
  error(title: string, message: string): void {

    let text: string;

    if (Array.isArray(message)) {
      text = message.join('\n');
    } else if (typeof message === 'object') {
      text = this.formatValidationErrors(message);
    } else {
      text = message;
    }

    this.show('error', title, text);
  }

  async confirm(title: string, message: string, confirmText = 'Si, continuar', cancelText = 'Cancelar'): Promise<boolean> {

    const result = await Swal.fire({
      title,
      text: message,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#e91e63',
      cancelButtonColor: '#6c757d',
      confirmButtonText: confirmText,
      cancelButtonText: cancelText
    });

    return result.isConfirmed;
  }

  async confirmDelete(itemName: string): Promise<boolean> {
        return this.confirm(
      '¿Estás seguro?',
      `Esto eliminará "${itemName}" permanentemente. Esta acción no se puede deshacer.`,
      'Sí, eliminar',
      'No, cancelar'
    );
  }

  async confirmDeactivate(itemName: string): Promise<boolean> {
        return this.confirm(
      '¿Estás seguro?',
      `Esto desactivara "${itemName}". Esta acción se puede deshacer.`,
      'Sí, desactivar',
      'No, cancelar'
    );
  }

  async confirmActivate(itemName: string): Promise<boolean> {
        return this.confirm(
      '¿Estás seguro?',
      `Esto activara "${itemName}". Esta acción se puede deshacer.`,
      'Sí, activar',
      'No, cancelar'
    );
  }

  private formatValidationErrors(errors: any): string {

    if (typeof errors === 'string') return errors;

    if (Array.isArray(errors)) {
      return errors.join('\n');
    }

    const lines: string[] = [];
    for (const [field, messages] of Object.entries(errors)) {
      const fieldName = this.translateFieldName(field);
      const errorList = Array.isArray(messages) ? messages : [messages];
      lines.push(`${fieldName}: ${errorList.join(', ')}`);
    }

    return lines.join('\n');
  }

    private translateFieldName(field: string): string {
    const translations: Record<string, string> = {
      'name': 'Nombre',
      'code': 'Código',
      'abbreviation': 'Abreviación',
      'price': 'Precio',
      'cost': 'Costo',
      'stock': 'Existencias',
      'rfc': 'RFC',
      'phone': 'Teléfono',
      'email': 'Correo',
      'password': 'Contraseña',
      'username': 'Usuario',
    };

    return translations[field.toLowerCase()] || field;
  }
}
