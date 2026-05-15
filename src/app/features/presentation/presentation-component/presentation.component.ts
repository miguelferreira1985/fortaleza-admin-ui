import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../../shared/material-module';
import { MatTableDataSource } from '@angular/material/table';
import { Presentation } from '../../../shared/models/presentation';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { PresentationService } from '../../../core/services/presentation.service';
import { NotificationService } from '../../../core/services/notification.service';
import { MatDialog } from '@angular/material/dialog';
import { PresentationDialogComponent } from '../presentation-dialog/presentation-dialog.component';
import { BreakpointObserver } from '@angular/cdk/layout';
import { Subscription } from 'rxjs';
import { dialogConfig } from '../../../core/utils/dialog.util';

@Component({
  selector: 'app-presentation.component',
  imports: [
    CommonModule,
    FormsModule,
    MaterialModule
  ],
  templateUrl: './presentation.component.html',
  styleUrl: './presentation.component.scss',
})
export class PresentationComponent implements OnInit, AfterViewInit, OnDestroy {

  private presentationService = inject(PresentationService);
  private notify = inject(NotificationService);
  private dialog = inject(MatDialog);
  private breakpoint = inject(BreakpointObserver);

  private subs = new Subscription();

  dataSource = new MatTableDataSource<Presentation>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  searchTerm: string = '';
  isLoading: boolean = false;
  totalItems = 0;

  readonly desktopCols = ['name', 'abbreviation', 'actions'];
  readonly tabletCols = ['name', 'abbreviation', 'actions'];
  readonly mobileCols = ['name', 'actions'];

  displayedColumns = this.desktopCols;

  ngOnInit(): void {
    this.loadPresentations();

    this.subs.add(
      this.breakpoint.observe([
        '(max-width: 599px)',
        '(min-width: 600px) and (max-width: 959px)'
      ]).subscribe(result => {
        if (result.breakpoints['(max-width: 599px)']) {
          this.displayedColumns = this.mobileCols;
        } else if (result.breakpoints['(min-width: 600px) and (max-width: 959px)']) {
          this.displayedColumns = this.tabletCols;
        } else {
          this.displayedColumns = this.desktopCols;
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadPresentations(): void {
    this.isLoading = true;

    this.presentationService.getAllPresentations().subscribe({
      next: (data) => {
        this.dataSource.data = data;
        this.totalItems = data.length;

        this.dataSource.filterPredicate = (data: Presentation, filter: string) => {
          const searchStr = filter.toLowerCase();
          return data.name.toLowerCase().includes(searchStr) || data.abbreviation.toLowerCase().includes(searchStr);
        };

        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al cargar presentaciones:', error);
        this.notify.error('Error', 'Nose pudieron cargar las presentaciones');
        this.isLoading = false;
      }
    });
  }

  applyFilter(): void {
    const filterValue = this.searchTerm.trim().toLowerCase();
    this.dataSource.filter = filterValue;

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  openCreateDialog(): void {
    const dialogRef= this.dialog.open(PresentationDialogComponent,
      dialogConfig('480px', {
        data: { presentation: null, mode: 'create' },
        disableClose: true
      })
    );

    dialogRef.afterClosed().subscribe((success: boolean) => {
      if (success) {
        this.loadPresentations();
      }
    });
  }

  openEditDialog(presentation: Presentation): void {
    const dialogRef= this.dialog.open(PresentationDialogComponent,
      dialogConfig('500px', {
        data: { presentation: { ...presentation }, mode: 'edit' },
        disableClose: true
      })
    );

    dialogRef.afterClosed().subscribe((success: boolean) => {
      if (success) {
        this.loadPresentations();
      }
    });
  }

  deletePresentation(presentation: Presentation): void {
    this.notify.confirm('¿Estás seguro?', `Deseas eliminar la presentación "${presentation.name}"? Esta acción no se puede deshacer.`)
      .then((confimed) => {
        if (confimed && presentation.id) {
          let id: number = presentation.id ?? 0;
          this.presentationService.deletePresentation(id).subscribe({
            next: (res) => {
              this.notify.success('¡Eliminado!', res.message || 'La presentación fue eliminada.');
              this.loadPresentations();
            },
            error: (err) => {
              console.error('Error al eliminar:', err);
              this.notify.error('Error', err?.error?.message || 'No se pudo eliminar');
            }
          });
        }
      });
  }

  trackById(index: number, item: Presentation): number {
    return item.id ?? index;
  }

}
