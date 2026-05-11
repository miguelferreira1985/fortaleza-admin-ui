import { CommonModule } from '@angular/common';
import { Component, Inject, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MaterialModule } from '../../../shared/material-module';
import { CashSessionService } from '../../../core/services/cash-session.service';
import { NotificationService } from '../../../core/services/notification.service';
import { CashMovementType } from '../../../shared/models/cash-session.models';

@Component({
  selector: 'app-cash-movement-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MaterialModule, MatDialogModule],
  template: `
    <h2 mat-dialog-title>
      <mat-icon>swap_vert</mat-icon>
      Movimiento de caja
    </h2>

    <mat-dialog-content>
      <!-- Tipo: Entrada o Salida (botones grandes touch-friendly) -->
      <div class="type-selector">
        <button class="type-btn entrada" [class.active]="type === 'ENTRADA'" (click)="type = 'ENTRADA'">
          <mat-icon>arrow_downward</mat-icon>
          <span>Entrada</span>
          <small>Ingreso de efectivo</small>
        </button>
        <button class="type-btn salida" [class.active]="type === 'SALIDA'" (click)="type = 'SALIDA'">
          <mat-icon>arrow_upward</mat-icon>
          <span>Salida</span>
          <small>Retiro de efectivo</small>
        </button>
      </div>

      <!-- Monto -->
      <mat-form-field appearance="outline" class="full">
        <mat-label>Monto</mat-label>
        <input matInput type="number" [(ngModel)]="amount" min="0.01" step="0.01" placeholder="0.00">
        <mat-icon matPrefix>attach_money</mat-icon>
      </mat-form-field>

      <!-- Motivo -->
      <mat-form-field appearance="outline" class="full">
        <mat-label>Motivo</mat-label>
        <input matInput [(ngModel)]="reason" placeholder="Ej: Pago de limpieza, fondo extra...">
        <mat-icon matPrefix>notes</mat-icon>
      </mat-form-field>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-raised-button color="primary"
        [disabled]="!amount || amount <= 0 || !reason.trim() || isSaving"
        (click)="save()">
        @if (isSaving) { <mat-icon class="spin">refresh</mat-icon> Guardando... }
        @else { <mat-icon>save</mat-icon> Guardar }
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    h2[mat-dialog-title] {
      display: flex; align-items: center; gap: 8px; color: #880e4f;
      mat-icon { color: #e91e63; }
    }

    mat-dialog-content { padding-top: 8px !important; }

    .type-selector {
      display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;
    }

    .type-btn {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      gap: 4px; height: 80px; border-radius: 12px;
      border: 2px solid #e0e0e0; background: white; cursor: pointer;
      font-size: 0.95rem; font-weight: 600; color: #666; transition: all 0.15s;

      mat-icon { font-size: 24px; }
      small { font-size: 0.72rem; font-weight: 400; color: #999; }

      &.entrada {
        &:hover, &.active { border-color: #2e7d32; background: #e8f5e9; color: #2e7d32; }
      }
      &.salida {
        &:hover, &.active { border-color: #e91e63; background: #fce4ec; color: #e91e63; }
      }
    }

    .full { width: 100%; }

    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    .spin { animation: spin 1s linear infinite; }
  `]
})
export class CashMovementDialogComponent {

  private cashService = inject(CashSessionService);
  private notify      = inject(NotificationService);

  type: CashMovementType = 'ENTRADA';
  amount = 0;
  reason = '';
  isSaving = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) private data: { sessionId: number },
    private dialogRef: MatDialogRef<CashMovementDialogComponent>
  ) {}

  save(): void {
    this.isSaving = true;
    this.cashService.registerMovement(this.data.sessionId, {
      type: this.type,
      amount: this.amount,
      reason: this.reason.trim()
    }).subscribe({
      next: () => {
        this.isSaving = false;
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.isSaving = false;
        this.notify.error('Error', err.error?.message || 'No se pudo registrar el movimiento');
      }
    });
  }
}
