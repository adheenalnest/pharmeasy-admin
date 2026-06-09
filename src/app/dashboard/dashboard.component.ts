import { Component, inject, signal } from '@angular/core';
import { Router, RouterModule, RouterOutlet } from '@angular/router';
import { AdminApiService } from '../services/admin-api.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterModule, RouterOutlet],
  template: `
    <div class="layout-container">
      <!-- Sidebar -->
      <aside class="sidebar" [class.open]="sidebarOpen()">
        <div class="sidebar-brand">
          <svg viewBox="0 0 120 130" width="36" height="36" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="120" height="130" rx="24" fill="#ffffff" />
            <path d="M60 25 V105 M20 65 H100" stroke="#10847e" stroke-width="16" stroke-linecap="round" />
          </svg>
          <span class="brand-text">PharmEasy Admin</span>
        </div>

        <nav class="sidebar-nav">
          <a routerLink="/dashboard" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" class="nav-item">
            <span class="nav-icon">📊</span> Overview
          </a>
          <a routerLink="/dashboard/products" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">💊</span> Products
          </a>
          <a routerLink="/dashboard/categories" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">📁</span> Categories
          </a>
          <a routerLink="/dashboard/orders" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">📦</span> Orders Log
          </a>
          <a routerLink="/dashboard/doctors" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">🩺</span> Doctors
          </a>
          <a routerLink="/dashboard/coupons" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">🏷️</span> Coupons
          </a>
          <a routerLink="/dashboard/delivery-charges" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">🚚</span> Delivery Pincodes
          </a>
          <a routerLink="/dashboard/blogs" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">✍️</span> Blogs & Content
          </a>
        </nav>

        <div class="sidebar-footer">
          <button (click)="logout()" class="btn btn-outline w-full logout-btn">
            🚪 Sign Out
          </button>
        </div>
      </aside>

      <!-- Main Panel -->
      <div class="main-panel">
        <header class="header">
          <div class="header-left">
            <button (click)="toggleSidebar()" class="sidebar-toggle-btn">
              ☰
            </button>
            <h2 class="page-title">Management Dashboard</h2>
          </div>
          <div class="header-right">
            <div class="user-profile-badge">
              <span class="user-avatar">👤</span>
              <span class="user-role-label">System Administrator</span>
            </div>
          </div>
        </header>

        <main class="main-content-area">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .sidebar {
      position: fixed;
      top: 0;
      left: 0;
      bottom: 0;
      width: 260px;
      background-color: var(--bg-sidebar);
      color: var(--text-white);
      display: flex;
      flex-direction: column;
      z-index: 100;
      transition: transform var(--transition-normal);
      border-right: 1px solid rgba(255, 255, 255, 0.05);
    }
    @media (max-width: 992px) {
      .sidebar {
        transform: translateX(-100%);
      }
      .sidebar.open {
        transform: translateX(0);
      }
    }
    .sidebar-brand {
      padding: 1.5rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }
    .brand-text {
      font-family: var(--font-title);
      font-weight: 700;
      font-size: 1.15rem;
      letter-spacing: 0.5px;
    }
    .sidebar-nav {
      flex: 1;
      padding: 1.5rem 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      overflow-y: auto;
    }
    .nav-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      border-radius: var(--radius-md);
      font-size: 0.9rem;
      font-weight: 500;
      color: rgba(255, 255, 255, 0.7);
      transition: all var(--transition-fast);
    }
    .nav-item:hover {
      color: var(--text-white);
      background-color: rgba(255, 255, 255, 0.05);
    }
    .nav-item.active {
      color: var(--text-white);
      background-color: var(--primary);
    }
    .nav-icon {
      font-size: 1.1rem;
    }
    .sidebar-footer {
      padding: 1.25rem 1rem;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
    }
    .logout-btn {
      color: #fca5a5;
      border-color: rgba(239, 68, 68, 0.2);
    }
    .logout-btn:hover {
      background-color: rgba(239, 68, 68, 0.1);
      border-color: rgba(239, 68, 68, 0.4);
    }
    .main-panel {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }
    .header {
      background: var(--surface);
      border-bottom: 1px solid var(--border-color);
      height: 70px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 2rem;
      position: sticky;
      top: 0;
      z-index: 90;
      margin-left: 260px;
      transition: margin-left var(--transition-normal);
    }
    @media (max-width: 992px) {
      .header {
        margin-left: 0;
        padding: 0 1rem;
      }
    }
    .header-left {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .sidebar-toggle-btn {
      display: none;
      background: transparent;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      color: var(--text-main);
    }
    @media (max-width: 992px) {
      .sidebar-toggle-btn {
        display: block;
      }
    }
    .page-title {
      font-size: 1.25rem;
      font-weight: 600;
    }
    .user-profile-badge {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background-color: var(--bg-app);
      padding: 0.5rem 1rem;
      border-radius: 9999px;
      font-size: 0.8rem;
      font-weight: 600;
    }
    .user-avatar {
      font-size: 1rem;
    }
    .main-content-area {
      flex: 1;
      background-color: var(--bg-app);
      margin-left: 260px;
      padding: 2rem;
      transition: margin-left var(--transition-normal);
    }
    @media (max-width: 992px) {
      .main-content-area {
        margin-left: 0;
        padding: 1.5rem;
      }
    }
  `]
})
export class DashboardComponent {
  private readonly apiService = inject(AdminApiService);
  private readonly router = inject(Router);

  sidebarOpen = signal(false);

  toggleSidebar() {
    this.sidebarOpen.set(!this.sidebarOpen());
  }

  logout() {
    this.apiService.clearToken();
    this.router.navigate(['/login']);
  }
}
