import { Component, Inject, inject, OnInit } from '@angular/core';
import { User } from '../../shared/models/user';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../shared/material-module';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserService } from '../../core/services/user.service';
import { NotificationService } from '../../core/services/notification.service';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CustomValidators } from '../../shared/custom-validators';
import { UpdateRolesRequestDto } from '../../shared/models/update-roles-requets-dto';

export interface UpdateRolesDialogData {
  user: User;
}

@Component({
  selector: 'app-update-roles-dialog.component',
  imports: [
    CommonModule,
    MaterialModule,
    ReactiveFormsModule
  ],
  templateUrl: './update-roles-dialog.component.html',
  styleUrl: './update-roles-dialog.component.scss',
})
export class UpdateRolesDialogComponent implements OnInit {

  private fb = inject(FormBuilder);
  private userService = inject(UserService);
  private notify = inject(NotificationService);

  form!: FormGroup;
  isLoading = false;

  roles = [
    { id: 'cashier', name: 'Cajero',       icon: 'point_of_sale' },
    { id: 'manager', name: 'Gerente',       icon: 'supervisor_account' },
    { id: 'admin',   name: 'Administrador', icon: 'admin_panel_settings' }
  ];

  constructor(
    public dialogRef: MatDialogRef<UpdateRolesDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: UpdateRolesDialogData
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      roles: [this.mapUserRolesToIds(this.data.user.roles), [Validators.required]]
    }, { validators: CustomValidators.minSelected(1) });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const dto: UpdateRolesRequestDto = {
      roles: this.form.get('roles')?.value ?? []
    }

    this.notify.confirm(
      '¿Actualizar permisos?',
      `¿Confirmas el cambio de permisos para "${this.data.user.username}"?`
    ).then((confimed) => {
      if (confimed) {
        this.isLoading = true;
        const id = this.data.user.id as number;
        this.userService.updateRoles(id, dto).subscribe({
          next: (res) => {
            this.notify.success('¡Permisos actualizados!', res.message || 'Los permisos del usuario fueron actualizados');
            this.dialogRef.close(true);
          },
          error: (err) => {
            this.isLoading = false;
            this.notify.error('Error', err.error?.message || 'No se pudieron actualizar');
          }
        });
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  private mapUserRolesToIds(userRoles: any): string[] {
    if (!Array.isArray(userRoles)) return [];
    const map: Record<string, string> = {
      'ROLE_ADMIN': 'admin', 'ROLE_MANAGER': 'manager', 'ROLE_CASHIER': 'cashier'
    };
    if (typeof userRoles[0] === 'string') return userRoles.map((r: string) => map[r] ?? r);
    return userRoles.map((r: any) => map[r?.name]).filter(Boolean);
  }

}
