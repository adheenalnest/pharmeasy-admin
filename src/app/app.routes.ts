import { inject } from '@angular/core';
import { Routes, Router } from '@angular/router';
import { AdminApiService } from './services/admin-api.service';

// Inline Authentication Route Guard
const adminAuthGuard = () => {
  const apiService = inject(AdminApiService);
  const router = inject(Router);
  if (apiService.isLoggedIn()) {
    return true;
  }
  router.navigate(['/login']);
  return false;
};

export const routes: Routes = [
  { 
    path: 'login', 
    loadComponent: () => import('./auth/login.component').then(m => m.LoginComponent) 
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [adminAuthGuard],
    children: [
      { 
        path: '', 
        loadComponent: () => import('./dashboard/overview/overview.component').then(m => m.OverviewComponent) 
      },
      { 
        path: 'products', 
        loadComponent: () => import('./dashboard/products/products.component').then(m => m.ProductsComponent) 
      },
      { 
        path: 'categories', 
        loadComponent: () => import('./dashboard/categories/categories.component').then(m => m.CategoriesComponent) 
      },
      { 
        path: 'blogs', 
        loadComponent: () => import('./dashboard/blogs/blogs.component').then(m => m.BlogsComponent) 
      },
      { 
        path: 'coupons', 
        loadComponent: () => import('./dashboard/coupons/coupons.component').then(m => m.CouponsComponent) 
      },
      { 
        path: 'orders', 
        loadComponent: () => import('./dashboard/orders/orders.component').then(m => m.OrdersComponent) 
      },
      { 
        path: 'delivery-charges', 
        loadComponent: () => import('./dashboard/delivery-charges/delivery-charges.component').then(m => m.DeliveryChargesComponent) 
      },
      { 
        path: 'doctors', 
        loadComponent: () => import('./dashboard/doctors/doctors.component').then(m => m.DoctorsComponent) 
      }
    ]
  },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' }
];
