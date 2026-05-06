import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../../shared/material-module';
import { HasRoleDirective } from '../../../core/directives/has-role.directive';
import { CashSessionService } from '../../../core/services/cash-session.service';
import { NotificationService } from '../../../core/services/notification.service';
import { CashCutReport, CashSessionResponse } from '../../../shared/models/cash-session.models';

type CutMode = 'SESSION' | 'DAY' | 'EMPLOYEE';

@Component({
  selector: 'app-cash-cut.component',
  imports: [
    CommonModule,
    FormsModule,
    MaterialModule,
    HasRoleDirective,
    CurrencyPipe,
    DatePipe
  ],
  templateUrl: './cash-cut.component.html',
  styleUrl: './cash-cut.component.scss',
})
export class CashCutComponent implements OnInit {

  private cashService = inject(CashSessionService);
  private notify = inject(NotificationService);

  cutMode: CutMode = 'DAY';

  selectedDate = this.toDateString(new Date());
  dateFrom = this.toDateString(new Date());
  dateTo = this.toDateString(new Date());
  selectedSessionId: number | null = null;
  selectedEmployeeId: number | null = null;

  sessions: CashSessionResponse[] = [];
  report: CashCutReport | null = null;
  isLoading = false;
  isPrinting = false;

  get availableEmployees(): { id: number, name: string }[] {
    const map = new Map<number, string>();
    this.sessions.forEach(s => map.set(s.employeeId, s.employeeName));
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }

  ngOnInit(): void {
    this.loadSessions();
  }

  loadSessions(): void {
    this.cashService.getAll().subscribe({
      next: (res) => {
        this.sessions = res.data ?? [];
      }
    });
  }

  onModeChange(): void {
    this.report = null;
  }

  generateCut(): void {
    this.isLoading = true;
    this.report = null;

    let obs$;

    switch(this.cutMode) {
      case 'DAY':
        obs$ = this.cashService.getCutByDay(this.selectedDate);
        break;
      case 'SESSION':
        if (!this.selectedSessionId) {
          this.notify.warning('Seleccione una sesión', '');
          this.isLoading = false;
        }
        obs$ = this.cashService.getCutBySession(this.selectedSessionId!);
        break;
      case 'EMPLOYEE':
        if (!this.selectedEmployeeId) {
          this.notify.warning('Seleccione un empleado', '');
          this.isLoading = false;
        }
        obs$ = this.cashService.getCutByEmployee(this.selectedEmployeeId!, this.dateFrom, this.dateTo);
        break;
    }

    obs$.subscribe({
      next: (res) => {
        this.report = res.data;
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        this.notify.error('Error', err.error?.message || 'No se pudo generar el corte');
      }
    });
  }

  print(): void {
    window.print();
  }

  getCutTitle(): string {
    const titles: Record<CutMode, string> = {
      DAY: 'Corte del Día',
      SESSION: 'Corte por Turno',
      EMPLOYEE: 'Corte por Empleado'
    };
    return titles[this.cutMode];
  }

  getDifferenceClass(diff: number | undefined): string {
    if (diff === undefined || diff === null) return '';
    if (diff > 0) return 'positive';
    if (diff < 0) return 'negative';
    return 'zero';
  }

  getDifferenceLabel(diff: number | undefined): string {
    if (diff === undefined || diff === null) return '—';
    if (diff > 0) return `Sobrante: $${Math.abs(diff).toFixed(2)}`;
    if (diff < 0) return `Faltante: $${Math.abs(diff).toFixed(2)}`;
    return 'Cuadra exacto ✓';
  }

  getSessionLabel(session: CashSessionResponse): string {
    const date = new Date(session.openingDateTime);
    return `${session.employeeName} — ${date.toLocaleDateString('es-MX')} ${date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}`;
  }

  private toDateString(date: Date): string {
    return date.toISOString().split('T')[0];
  }

}
