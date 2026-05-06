import { Component, inject, Inject, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MaterialModule } from '../../../shared/material-module';
import { CashSessionService } from '../../../core/services/cash-session.service';
import { CashSessionResponse, CashCutReport } from '../../../shared/models/cash-session.models';

interface DialogData {
  session: CashSessionResponse;
}

@Component({
  selector: 'app-cash-cut-report-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MaterialModule,
    CurrencyPipe,
    DatePipe
  ],
  templateUrl: './cash-cut-report-dialog.component.html',
  styleUrl: './cash-cut-report-dialog.component.scss'
})
export class CashCutReportDialogComponent implements OnInit {

  private cashService = inject(CashSessionService);
  private dialogRef = inject(MatDialogRef<CashCutReportDialogComponent>);

  session: CashSessionResponse;
  cutReport: CashCutReport | null = null;
  isLoading = true;

  constructor(@Inject(MAT_DIALOG_DATA) public data: DialogData) {
    this.session = data.session;
  }

  ngOnInit(): void {
    this.loadCutReport();
  }

  loadCutReport(): void {
    this.isLoading = true;
    this.cashService.getCutBySession(this.session.id).subscribe({
      next: (res) => {
        this.cutReport = res.data;
        this.isLoading = false;
      },
      error: () => {
        // Si falla, usar los datos básicos de la sesión
        this.isLoading = false;
      }
    });
  }

  print(): void {
    window.print();
  }

  close(): void {
    this.dialogRef.close();
  }

  get totalCashMovements(): number {
    if (!this.cutReport) return 0;
    return this.cutReport.totalCashInflows - this.cutReport.totalCashOutflows;
  }

  get hasDifference(): boolean {
    return this.session.cashDifference !== undefined &&
           this.session.cashDifference !== null &&
           this.session.cashDifference !== 0;
  }

  get differenceClass(): string {
    if (!this.session.cashDifference) return '';
    return this.session.cashDifference > 0 ? 'positive' : 'negative';
  }

  get differenceIcon(): string {
    if (!this.session.cashDifference) return 'check_circle';
    return this.session.cashDifference > 0 ? 'trending_up' : 'trending_down';
  }

}
