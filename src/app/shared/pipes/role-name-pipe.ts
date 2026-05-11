import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'roleName'
})
export class RoleNamePipe implements PipeTransform {

  private readonly roleMap: Record<string, string> = {
    ROLE_CASHIER: 'Cajero',
    ROLE_ADMIN: 'Administrador',
    ROLE_MANAGER: 'Gerente'
  };

  transform(value: any[] | undefined): string {
    if (!value || value.length === 0) return 'Sin permisos';

    return value
      .map(roleObj => {
        // si viene como string
        if (typeof roleObj === 'string') {
          return this.roleMap[roleObj] ?? roleObj;
        }
        // si viene como objeto { name: "ROLE_ADMIN" }
        if (roleObj.name) {
          return this.roleMap[roleObj.name] ?? roleObj.name;
        }
        return JSON.stringify(roleObj); // fallback para debug
      })
      .join(', ');
  }
}

