import { Routes } from '@angular/router';
import { BlankComponent } from './layouts/blank/blank-component/blank-component';
import { authGuard } from './core/guards/auth.guard';
import { MainLayoutComponent } from './layouts/main-layout/main-layout.component/main-layout.component';

export const routes: Routes = [
        // Routes without a layout (Login, etc.)
  {
    path: '',
    component: BlankComponent,
    children: [
      { path: '', redirectTo: 'login', pathMatch: 'full' },
      {
        path: 'login',
        loadComponent: () =>
          import('./features/auth/login/login.component').then(m => m.LoginComponent)
      }
    ]
  },
    // Routes with the AdminLTE layout, protected by the guard
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
        canActivate: [authGuard]
      },
      {
        path: 'presentation',
        loadComponent: () =>
          import('./features/presentation/presentation-component/presentation.component').then(m => m.PresentationComponent),
        canActivate: [authGuard]
      },
      {
        path: 'category',
        loadComponent: () =>
          import('./features/category/category.component/category.component').then(m => m.CategoryComponent),
        canActivate: [authGuard]
      },
      {
        path: 'subcategory',
        loadComponent: () =>
          import('./features/subcategory/subcategory.component/subcategory.component').then(m => m.SubcategoryComponent),
        canActivate: [authGuard]
      },
      {
        path: 'client',
        loadComponent: () =>
          import('./features/client/client.component/client.component').then(m => m.ClientComponent),
        canActivate: [authGuard]
      },
      {
        path: 'employee',
        loadComponent: () =>
          import('./features/employee/employee.component/employee.component').then(m => m.EmployeeComponent),
        canActivate: [authGuard],
        data: { roles: ['ROLE_ADMIN', 'ROLE_MANAGER'] }
      },
      {
        path: 'supplier',
        loadComponent: () =>
          import('./features/supplier/supplier.component/supplier.component').then(m => m.SupplierComponent),
        canActivate: [authGuard]
      },
      {
        path: 'inventory-movement',
        loadComponent: () =>
          import('./features/inventory-movement/inventory-movement.component').then(m => m.InventoryMovementComponent),
        canActivate: [authGuard],
        data: { roles: ['ROLE_ADMIN', 'ROLE_MANAGER'] }
      },
      {
        path: 'user',
        loadComponent: () =>
          import('./features/user/user.component/user.component').then(m => m.UserComponent),
        canActivate: [authGuard],
        data: { roles: ['ROLE_ADMIN', 'ROLE_MANAGER'] }
      },
      {
        path: 'product',
        loadComponent: () => import('./features/products/product.component/product.component').then(m => m.ProductComponent)
      },
      {
        path: 'product/new',
        loadComponent: () => import('./features/products/product-form.component/product-form.component').then(m => m.ProductFormComponent)
      },
      {
        path: 'product/edit/:id',
        loadComponent: () => import('./features/products/product-form.component/product-form.component').then(m => m.ProductFormComponent)
      }/*
      {
        path: 'product',
        loadComponent: () =>
          import('./components/product-component/product-component').then(m => m.ProductComponent),
        canActivate: [authGuard]
      },*//*,,,,,
,,
      {
        path: 'suppliers/:supplierId/purchase-orders',
        loadComponent: () =>
          import('./components/supplier-purchase-orders/supplier-purchase-orders.component').then(m => m.SupplierPurchaseOrdersComponent),
        canActivate: [authGuard]
      },
      {
        path: 'purchase-orders',
        loadComponent: () =>
          import('./components/purchase-order-list/purchase-order-list.component').then(m => m.PurchaseOrderListComponent),
        canActivate: [authGuard]
      },
      {
        path: 'purchase-orders/:id',
        loadComponent: () =>
          import('./components/purchase-order-detail-component/purchase-order-detail.component').then(m => m.PurchaseOrderDetailComponent),
        canActivate: [authGuard]
      },
      {
        path: 'suppliers/:supplierId/purchase-orders/:id',
        loadComponent: () =>
          import('./components/purchase-order-detail-component/purchase-order-detail.component').then(m => m.PurchaseOrderDetailComponent),
        canActivate: [authGuard]
      },
      {
        path: 'purchase-orders/:id/receive',
        loadComponent: () =>
          import('./components/purchase-order-receive/purchase-order-receive.component').then(m => m.PurchaseOrderReceiveComponent),
        canActivate: [authGuard]
      } */
    ]
  }
];
