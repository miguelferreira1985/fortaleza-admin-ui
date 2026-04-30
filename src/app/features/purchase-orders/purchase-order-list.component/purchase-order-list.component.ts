import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, inject, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MaterialModule } from '../../../shared/material-module';
import { SupplierService } from '../../../core/services/supplier.service';
import { PurchaseOrderService } from '../../../core/services/purchase-order.service';
import { Router } from '@angular/router';
import { NotificationService } from '../../../core/services/notification.service';
import { MatTableDataSource } from '@angular/material/table';
import { PurchaseOrder, PurchaseOrderStatusUpdateRequestDTO } from '../../../shared/models/purchase-order.models';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { Supplier } from '../../../shared/models/supplier';
import { PurchaseOrderStatus } from '../../../shared/models/purchase-order-status.enum';
import { getStatusConfig } from '../../../core/utils/purchase-order-status.util';
import { map, Observable, startWith } from 'rxjs';

@Component({
  selector: 'app-purchase-order-list.component',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MaterialModule
  ],
  templateUrl: './purchase-order-list.component.html',
  styleUrl: './purchase-order-list.component.scss',
})
export class PurchaseOrderListComponent implements OnInit, AfterViewInit {

  private fb = inject(FormBuilder);
  private supplierService = inject(SupplierService);
  private purchaseOrderService = inject(PurchaseOrderService);
  private router = inject(Router);
  private notify = inject(NotificationService);

  filterForm!: FormGroup;
  dataSource = new MatTableDataSource<PurchaseOrder>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  suppliers: Supplier[] = [];
  isLoading = false;
  hasSearched = false;

  supplierSearchControl = new FormControl('');
  filteredSuppliers$!: Observable<Supplier[]>;

  readonly statusEnum = PurchaseOrderStatus;
  readonly getStatusConfig = getStatusConfig;

  readonly statusOptions = [
    { value: 'ALL',                              label: 'Todas' },
    { value: PurchaseOrderStatus.PENDIENTE,      label: 'Pendiente' },
    { value: PurchaseOrderStatus.COMPLETADA,     label: 'Completada' },
    { value: PurchaseOrderStatus.CANCELADA,      label: 'Cancelada' },
  ];

  displayedColumns = ['id', 'supplierName', 'createdDateTime', 'expectedDeliveryDate', 'status', 'totalWithTaxes', 'totalWithoutTaxes', 'actions'];

  ngOnInit(): void {
    this.buildForm();
    this.loadSuppliers();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  buildForm(): void {
    this.filterForm = this.fb.group({
      supplierId: [null, Validators.required],
      status:     [{ value: 'ALL', disabled: true }]
    });

    this.filterForm.get('supplierId')?.valueChanges.subscribe(val => {
      const statusCtrl = this.filterForm.get('status')!;
      val ? statusCtrl.enable({ emitEvent: false })
          : statusCtrl.disable({ emitEvent: false });
    });
  }

  loadSuppliers(): void {
    this.supplierService.getSuppliers(true).subscribe({
      next: data => {
        this.suppliers = data;
        this.setupAutocomplete();
      },
      error: err => console.error(err)
    });
  }

  setupAutocomplete(): void {
    this.filteredSuppliers$ = this.supplierSearchControl.valueChanges.pipe(
      startWith(''),
      map(value => {
        const searchText = typeof value === 'string' ? value : '';
        return this.filterSuppliers(searchText);
      })
    );
  }

  get canSearch(): boolean {
    return this.filterForm.valid && !this.isLoading;
  }

  onSearch(): void {
    if (!this.filterForm.valid) { this.filterForm.markAllAsTouched(); return; }

    const supplierId = this.filterForm.get('supplierId')!.value as number;
    const statusVal  = this.filterForm.get('status')!.enabled
      ? this.filterForm.get('status')!.value
      : 'ALL';

    this.isLoading = true;
    this.hasSearched = true;

    this.purchaseOrderService.getBySupplier(supplierId).subscribe({
      next: res => {
        const orders: PurchaseOrder[] = res.data ?? res;
        this.dataSource.data = (statusVal === 'ALL' ? orders : orders.filter(o => o.status === statusVal)).sort((a, b) => this.sortByStatus(a, b));
        this.isLoading = false;
      },
      error: err => {
        console.error(err);
        this.notify.error('Error', 'No se pudieron cargar las órdenes');
        this.isLoading = false;
      }
    });
  }

  viewDetails(order: PurchaseOrder): void {
    this.router.navigate(['/purchase-orders', order.id]);
  }

  markAsCompleted(order: PurchaseOrder): void {
    this.notify.confirm('¿Completar orden?', `¿Marcas la orden #${order.id} como COMPLETADA?`)
      .then((confirmed) => {
        if (confirmed) {
          this.updateStatus(order, PurchaseOrderStatus.COMPLETADA);
        }
      });
  }

  cancelOrder(order: PurchaseOrder): void {
    this.notify.confirm('¿Cancelar orden?', `¿Cancelas la orden #${order.id}? Esta acción no se puede deshacer.`)
      .then((confirmed) => {
        if (confirmed) {
          this.updateStatus(order, PurchaseOrderStatus.CANCELADA);
        }
      });
  }

  displaySupplier(supplier: Supplier | null): string {
    return supplier ? supplier.name : '';
  }

  onSupplierSelected(supplier: Supplier): void {
    this.filterForm.patchValue({ supplierId: supplier.id });
  }

  private filterSuppliers(searchText: string): Supplier[] {
    if (!searchText){
      return this.suppliers;
    }

    const filterValue = searchText.toLowerCase().trim();
    return this.suppliers.filter(supplier => supplier.name.toLowerCase().includes(filterValue));
  }

  private updateStatus(order: PurchaseOrder, newStatus: PurchaseOrderStatus): void {
    const req: PurchaseOrderStatusUpdateRequestDTO = { newStatus };
    this.isLoading = true;
    this.purchaseOrderService.updateStatus(order.id, req).subscribe({
      next: res => {
        const updated = res.data ?? res;
        const idx = this.dataSource.data.findIndex(o => o.id === updated.id);
        if (idx >= 0) {
          const data = [...this.dataSource.data];
          data[idx] = updated;
          this.dataSource.data = data;
        }
        this.notify.success('¡Actualizado!', res.message || 'La orden de compra fue actualizada');
        this.isLoading = false;
      },
      error: err => {
        this.notify.error('Error', err.error?.message);
        this.isLoading = false;
      }
    });
  }

  private sortByStatus(a: PurchaseOrder, b: PurchaseOrder): number {
    const priority: Record<string, number> = {
      'PENDIENTE':             0,
      'PARCIALMENTE_RECIBIDA': 1,
      'COMPLETADA':            2,
      'CANCELADA':             3
    };

    const pa = priority[a.status] ?? 99;
    const pb = priority[b.status] ?? 99;

    if (pa !== pb) return pa - pb;

    return (b.id ?? 0) - (a.id ?? 0);
  }
}
