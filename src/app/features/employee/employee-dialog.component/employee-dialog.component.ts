import { CommonModule } from '@angular/common';
import { Component, Inject, inject } from '@angular/core';
import { MaterialModule } from '../../../shared/material-module';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Employee } from '../../../shared/models/employee';
import { EmployeeService } from '../../../core/services/employee.service';
import { NotificationService } from '../../../core/services/notification.service';
import { CustomValidators } from '../../../shared/custom-validators';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { EmployeeRequestDto } from '../../../shared/models/employee-request-dto';

export interface EmployeeDialogData {
  employee: Employee | null;
}

@Component({
  selector: 'app-employee-dialog.component',
  imports: [
    CommonModule,
    MaterialModule,
    ReactiveFormsModule
  ],
  templateUrl: './employee-dialog.component.html',
  styleUrl: './employee-dialog.component.scss',
})
export class EmployeeDialogComponent {

  private fb = inject(FormBuilder);
  private employeeService = inject(EmployeeService);
  private notify = inject(NotificationService);

  private readonly passwordMatchValidator = CustomValidators.matchFields('password', 'confirmPassword');

  employeeForm!: FormGroup;
  isEditMode = false;
  isLoading = false;
  hidePassword = true;
  hideConfirmPassword = true;

  roles = [
    { id: 'cashier', name: 'Cajero' },
    { id: 'manager', name: 'Gerente' },
    { id: 'admin',   name: 'Administrador' }
  ];

  constructor(
    public dialogRef: MatDialogRef<EmployeeDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: EmployeeDialogData
  ) {}

  ngOnInit(): void {
    this.initForm();

    if (this.data.employee) {
      this.isEditMode = true;
      this.loadEmployeeData();
    }

    this.employeeForm.get('createUser')?.valueChanges.subscribe((checked: boolean) => {
      this.applyUserValidators(checked);
    });


    this.employeeForm.get('password')?.valueChanges.subscribe(() => {
      this.employeeForm.get('confirmPassword')?.updateValueAndValidity({ onlySelf: true, emitEvent: false });
    });
  }

  initForm(): void {
    this.employeeForm = this.fb.group({
      id:              [null],
      firstName:       ['', [Validators.required, Validators.maxLength(50)]],
      lastName:        ['', [Validators.required, Validators.maxLength(50)]],
      address:         ['', [Validators.maxLength(100)]],
      email:           ['', [Validators.email]],
      phone:           ['', [Validators.required, Validators.pattern(/\+?[0-9]{10,15}/)]],
      ssn:             ['', [Validators.maxLength(20)]],
      // Campos de usuario (opcionales)
      createUser:      [false],
      username:        [''],
      password:        [''],
      confirmPassword: [''],
      roles:           [[]]
    });
  }

  loadEmployeeData(): void {
    const e = this.data.employee!;
    this.employeeForm.patchValue({
      id:        e.id,
      firstName: e.firstName,
      lastName:  e.lastName,
      address:   e.address,
      email:     e.email,
      phone:     e.phone,
      ssn:       e.ssn,
      createUser: false
    });
  }

  get showUserSection(): boolean {
    return !this.isEditMode && this.employeeForm.get('createUser')?.value === true;
  }

  onSubmit(): void {
    if (this.employeeForm.invalid) {
      this.employeeForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const v = this.employeeForm.value;

    const dto: EmployeeRequestDto = {
      id:        v.id,
      firstName: v.firstName,
      lastName:  v.lastName,
      address:   v.address,
      email:     v.email,
      phone:     v.phone,
      ssn:       v.ssn,
      userRequestDTO: v.createUser ? {
        username: v.username,
        password: v.password,
        roles:    v.roles
      } : null
    };

    if (this.isEditMode && dto.id) {
      this.employeeService.updateEmployee(dto.id, dto).subscribe({
        next: (res) => {
          this.notify.success('¡Actualizado!', res?.message || 'Empleado actualizado');
          this.dialogRef.close(true);
        },
        error: (err) => {
          this.isLoading = false;
          this.notify.error('Error', err.error?.message || 'No se pudo actualizar');
        }
      });
    } else {
      this.employeeService.createEmployee(dto).subscribe({
        next: (res) => {
          this.notify.success('¡Creado!', res?.message || 'Empleado creado');
          this.dialogRef.close(true);
        },
        error: (err) => {
          this.isLoading = false;
          this.notify.error('Error', err.error?.message || 'No se pudo crear');
        }
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  hasError(field: string): boolean {
    const f = this.employeeForm.get(field);
    return !!(f && f.invalid && (f.dirty || f.touched));
  }

  getErrorMessage(field: string): string {
    const f = this.employeeForm.get(field);
    if (f?.hasError('required'))   return 'Este campo es obligatorio';
    if (f?.hasError('email'))      return 'Formato de email inválido';
    if (f?.hasError('pattern'))    return 'Formato de teléfono inválido (10-15 dígitos)';
    if (f?.hasError('maxlength'))  return `Máximo ${f.errors?.['maxlength'].requiredLength} caracteres`;
    if (f?.hasError('minlength'))  return `Mínimo ${f.errors?.['minlength'].requiredLength} caracteres`;
    return '';
  }

  private applyUserValidators(enabled: boolean): void {
    const username        = this.employeeForm.get('username')!;
    const password        = this.employeeForm.get('password')!;
    const confirmPassword = this.employeeForm.get('confirmPassword')!;
    const roles           = this.employeeForm.get('roles')!;

    if (enabled) {
      username.setValidators([Validators.required]);
      password.setValidators([Validators.required, Validators.minLength(8)]);
      confirmPassword.setValidators([Validators.required]);
      roles.setValidators([Validators.required]);
      this.employeeForm.addValidators(this.passwordMatchValidator);
    } else {
      username.clearValidators();
      password.clearValidators();
      confirmPassword.clearValidators();
      roles.clearValidators();
      confirmPassword.setErrors(null);
      username.setValue('');
      password.setValue('');
      confirmPassword.setValue('');
      roles.setValue([]);
      this.employeeForm.removeValidators(this.passwordMatchValidator);
    }

    [username, password, confirmPassword, roles].forEach(c =>
      c.updateValueAndValidity({ emitEvent: false })
    );
    this.employeeForm.updateValueAndValidity({ emitEvent: false });
  }

}
