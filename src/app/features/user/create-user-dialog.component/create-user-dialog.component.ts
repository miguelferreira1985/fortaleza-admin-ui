import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { MaterialModule } from '../../../shared/material-module';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { EmployeeService } from '../../../core/services/employee.service';
import { CustomValidators } from '../../../shared/custom-validators';
import { Employee } from '../../../shared/models/employee';
import { MatDialogRef } from '@angular/material/dialog';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-create-user-dialog.component',
  imports: [
    CommonModule,
    MaterialModule,
    ReactiveFormsModule
  ],
  templateUrl: './create-user-dialog.component.html',
  styleUrl: './create-user-dialog.component.scss',
})
export class CreateUserDialogComponent implements OnInit {

  private fb = inject(FormBuilder);
  private employeeService = inject(EmployeeService);
  private notify = inject(NotificationService);

  private readonly passwordMatchValidator = CustomValidators.matchFields('password', 'confirmPassword');

  form!: FormGroup;
  isLoading = false;
  hidePassword = true;
  hideConfirmPassword = true;

  // Autocomplete de empleados
  allEmployees: Array<Employee & { fullName: string }> = [];
  filteredEmployees: Array<Employee & { fullName: string }> = [];

  roles = [
    { id: 'cashier', name: 'Cajero',       icon: 'point_of_sale' },
    { id: 'manager', name: 'Gerente',       icon: 'supervisor_account' },
    { id: 'admin',   name: 'Administrador', icon: 'admin_panel_settings' }
  ];

  constructor(public dialogRef: MatDialogRef<CreateUserDialogComponent>) {}

  ngOnInit(): void {
    this.initForm();
    this.loadEmployees();

    // Escuchar cambios en el autocomplete de empleado
    this.form.get('employeeObj')?.valueChanges.subscribe(val => {
      if (typeof val === 'string') {
        this.filteredEmployees = this.filterEmployees(val);
      } else {
        this.filteredEmployees = this.allEmployees;
        if (val?.id) {
          this.form.patchValue({ employeeId: val.id }, { emitEvent: false });
          this.enableFields();
        }
      }
    });

    // Revalidar confirmPassword
    this.form.get('password')?.valueChanges.subscribe(() => {
      this.form.get('confirmPassword')?.updateValueAndValidity({ onlySelf: true, emitEvent: false });
    });
  }

  initForm(): void {
    this.form = this.fb.group({
      employeeObj: [null, Validators.required],
      employeeId:  [null],
      username:    [{ value: '', disabled: true }, [Validators.required, Validators.minLength(5)]],
      password:    [{ value: '', disabled: true }, [Validators.required, Validators.minLength(8)]],
      confirmPassword: [{ value: '', disabled: true }, [Validators.required]],
      roles: [{ value: [], disabled: true }, [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  loadEmployees(): void {
    this.employeeService.getEmployees(true).subscribe({
      next: (data) => {
        this.allEmployees = (data ?? [])
          .filter(e => !e.user)
          .map(e => ({ ...e, fullName: `${e.firstName} ${e.lastName}`.trim() }));
        this.filteredEmployees = this.allEmployees;
      }
    });
  }

  displayEmployee(emp: any): string {
    return emp?.fullName ?? '';
  }

  get showFields(): boolean {
    const val = this.form.get('employeeObj')?.value;
    return val && typeof val === 'object';
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const employeeId = this.form.get('employeeId')?.value as number;
    const userDto = {
      username: this.form.get('username')?.value,
      password: this.form.get('password')?.value,
      roles:    this.form.get('roles')?.value ?? []
    };

    this.employeeService.createUserForEmployee(employeeId, userDto).subscribe({
      next: (res) => {
        this.notify.success('¡Usuario creado!', res?.message);
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.isLoading = false;
        this.notify.error('Error', err.error?.message || 'No se pudo crear');
      }
    });
  }

  onCancel(): void { this.dialogRef.close(false); }

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

  private enableFields(): void {
    ['username', 'password', 'confirmPassword', 'roles'].forEach(f =>
      this.form.get(f)?.enable()
    );
  }

  private filterEmployees(val: string) {
    const s = val.toLowerCase();
    return this.allEmployees.filter(e => e.fullName.toLowerCase().includes(s));
  }

}
