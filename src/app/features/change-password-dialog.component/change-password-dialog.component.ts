import { Component, Inject, inject, OnInit } from '@angular/core';
import { User } from '../../shared/models/user';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../shared/material-module';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserService } from '../../core/services/user.service';
import { NotificationService } from '../../core/services/notification.service';
import { CustomValidators } from '../../shared/custom-validators';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ChangePasswordRequestDto } from '../../shared/models/change-password-request-dto';

export interface ChangePasswordDialogData {
  user: User | null;
  userId?: number;
  username?: string;
}

@Component({
  selector: 'app-change-password-dialog.component',
  imports: [
    CommonModule,
    MaterialModule,
    ReactiveFormsModule
  ],
  templateUrl: './change-password-dialog.component.html',
  styleUrl: './change-password-dialog.component.scss',
})
export class ChangePasswordDialogComponent implements OnInit {

  private fb = inject(FormBuilder);
  private userService = inject(UserService);
  private notify = inject(NotificationService);

  private readonly passwordMatchValidator = CustomValidators.matchFields('newPassword', 'confirmPassword');

  form!: FormGroup;
  isLoading = false;
  hideNewPassword = true;
  hideConfirmPassword = true;

  // Nombre a mostrar en el título
  get displayName(): string {
    return this.data.user?.username ?? this.data.username ?? 'usuario';
  }

  get userId(): number {
    return (this.data.user?.id ?? this.data.userId ?? 0) as number;
  }

  constructor(
    public dialogRef: MatDialogRef<ChangePasswordDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ChangePasswordDialogData
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      newPassword:     ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });

    // Revalidar confirmPassword cuando cambia newPassword
    this.form.get('newPassword')?.valueChanges.subscribe(() => {
      this.form.get('confirmPassword')?.updateValueAndValidity({ onlySelf: true, emitEvent: false });
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const dto: ChangePasswordRequestDto = {
      newPassword: this.form.get('newPassword')?.value
    }

    this.notify.confirm('¿Cambiar contraseña?', `¿Confirmas el cambio de contraseña para "${this.displayName}"?`)
    .then((confirmed) => {
      if (confirmed) {
        this.isLoading = true;
        this.userService.changePassword(this.userId, dto).subscribe({
          next: (res) => {
            this.notify.success('¡Actualizacion exitosa!', res.message);
            this.dialogRef.close(true);
          },
          error: (err) => {
            this.isLoading = false;
            this.notify.error('Error', err.error?.message || 'No se pudo actualizar');
          }
        });
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  hasError(field: string): boolean {
    const f = this.form.get(field);
    return !!(f && f.invalid && (f.dirty || f.touched));
  }

  getErrorMessage(field: string): string {
    const f = this.form.get(field);
    if (f?.hasError('required'))  return 'Este campo es obligatorio';
    if (f?.hasError('minlength')) return `Mínimo ${f.errors?.['minlength'].requiredLength} caracteres`;
    return '';
  }

}
