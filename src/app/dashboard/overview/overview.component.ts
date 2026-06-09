import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { forkJoin } from 'rxjs';
import { AdminApiService } from '../../services/admin-api.service';

@Component({
  selector: 'app-overview',
  standalone: true,
  imports: [DatePipe, DecimalPipe],
  template: `
    <div class="overview-container">
      <h1 class="mb-4">System Overview</h1>

      @if (loading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Loading dashboard metrics...</p>
        </div>
      } @else {
        <!-- Metric Grid -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon info">💊</div>
            <div class="stat-info">
              <div class="stat-value">{{ productCount() }}</div>
              <div class="stat-label">Total Products</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon warning">📁</div>
            <div class="stat-info">
              <div class="stat-value">{{ categoryCount() }}</div>
              <div class="stat-label">Categories</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon success">🩺</div>
            <div class="stat-info">
              <div class="stat-value">{{ doctorCount() }}</div>
              <div class="stat-label">Active Doctors</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon danger">📦</div>
            <div class="stat-info">
              <div class="stat-value">{{ orderCount() }}</div>
              <div class="stat-label">Sales Orders</div>
            </div>
          </div>
        </div>

        <div class="overview-grid">
          <!-- Recent Orders Card -->
          <div class="card">
            <div class="card-header">
              <h3 class="card-title">📦 Recent Sales Orders</h3>
            </div>
            @if (recentOrders().length === 0) {
              <div class="empty-state">
                <div class="empty-state-icon">📭</div>
                <p>No orders recorded in the system yet.</p>
              </div>
            } @else {
              <div class="table-responsive">
                <table class="table">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Customer Name</th>
                      <th>Product</th>
                      <th>Quantity</th>
                      <th>Total Value</th>
                      <th>Placed At</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (order of recentOrders(); track order.id) {
                      <tr>
                        <td><strong>#{{ order.id }}</strong></td>
                        <td>{{ order.customer?.name || order.customer?.email }}</td>
                        <td>{{ order.product?.name }}</td>
                        <td>{{ order.quantity }}</td>
                        <td><strong>₹{{ order.totalPrice | number:'1.2-2' }}</strong></td>
                        <td>{{ order.createdAt | date:'short' }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          </div>

          <!-- Quick Stats summary Card -->
          <div class="card">
            <div class="card-header">
              <h3 class="card-title">🏷️ Active Coupons</h3>
            </div>
            @if (coupons().length === 0) {
              <div class="empty-state">
                <div class="empty-state-icon">🏷️</div>
                <p>No coupons available.</p>
              </div>
            } @else {
              <ul class="coupon-list">
                @for (c of coupons().slice(0, 5); track c.id) {
                  <li class="coupon-item">
                    <div class="coupon-name">
                      <span class="coupon-tag">CODE</span>
                      <strong>{{ c.couponName }}</strong>
                    </div>
                    <div class="coupon-value">
                      Discount: <span class="badge badge-success">{{ c.discount }}</span>
                    </div>
                  </li>
                }
              </ul>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 5rem 0;
      color: var(--text-muted);
    }
    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid var(--border-color);
      border-top-color: var(--primary);
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 1rem;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .overview-grid {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 1.5rem;
    }
    @media (max-width: 992px) {
      .overview-grid {
        grid-template-columns: 1fr;
      }
    }
    .coupon-list {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .coupon-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem;
      border-radius: var(--radius-sm);
      background: var(--bg-app);
      border: 1px solid var(--border-color);
    }
    .coupon-tag {
      font-size: 0.65rem;
      font-weight: 800;
      background: var(--secondary);
      color: var(--text-white);
      padding: 0.15rem 0.35rem;
      border-radius: 3px;
      margin-right: 0.5rem;
    }
  `]
})
export class OverviewComponent implements OnInit {
  private readonly apiService = inject(AdminApiService);

  loading = signal(true);
  productCount = signal(0);
  categoryCount = signal(0);
  doctorCount = signal(0);
  orderCount = signal(0);
  recentOrders = signal<any[]>([]);
  coupons = signal<any[]>([]);

  ngOnInit(): void {
    this.fetchMetrics();
  }

  fetchMetrics(): void {
    this.loading.set(true);

    forkJoin({
      products: this.apiService.getProducts(1, 1),
      categories: this.apiService.getCategories(),
      doctors: this.apiService.getDoctors(),
      orders: this.apiService.getOrders(1, 5),
      coupons: this.apiService.getCoupons()
    }).subscribe({
      next: (res: any) => {
        this.productCount.set(res.products.total || 0);
        this.categoryCount.set(res.categories.length || 0);
        this.doctorCount.set(res.doctors.length || 0);
        this.orderCount.set(res.orders.total || 0);
        this.recentOrders.set(res.orders.data || []);
        this.coupons.set(res.coupons || []);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }
}
