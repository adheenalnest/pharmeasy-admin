import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminApiService } from '../../services/admin-api.service';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [DatePipe, DecimalPipe, FormsModule],
  template: `
    <div class="orders-container">
      <div class="d-flex justify-between align-center mb-4">
        <h1>📦 Sales Orders Log</h1>
      </div>

      <!-- Search bar -->
      <div class="search-bar-container card">
        <div class="search-input-wrapper">
          <span class="search-icon">🔍</span>
          <input 
            type="text" 
            [(ngModel)]="searchQuery" 
            (input)="onSearch()"
            class="form-control" 
            placeholder="Search by customer name or email..."
          />
        </div>
      </div>

      <!-- Orders Table -->
      @if (loading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Loading orders log...</p>
        </div>
      } @else if (orders().length === 0) {
        <div class="empty-state">
          <div class="empty-state-icon">📦</div>
          <p>No sales orders logged in the system.</p>
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
                <th>Unit Price</th>
                <th>Total Value</th>
                <th>Order Date</th>
                <th class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (o of orders(); track o.id) {
                <tr>
                  <td><strong>#{{ o.id }}</strong></td>
                  <td>
                    <div style="font-weight: 600;">{{ o.customer?.name || 'Customer' }}</div>
                    <div style="font-size: 0.75rem; color: var(--text-muted);">{{ o.customer?.email }}</div>
                  </td>
                  <td>{{ o.product?.name }}</td>
                  <td>{{ o.quantity }}</td>
                  <td>₹{{ o.purchasePrice | number:'1.2-2' }}</td>
                  <td><strong>₹{{ o.totalPrice | number:'1.2-2' }}</strong></td>
                  <td>{{ o.createdAt | date:'medium' }}</td>
                  <td class="text-right">
                    <div class="d-flex gap-2 justify-end">
                      <button (click)="viewDetails(o.id)" class="btn btn-outline btn-sm">👁️ Details</button>
                      <button (click)="confirmDelete(o)" class="btn btn-danger btn-sm">🗑️ Delete</button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="pagination-bar d-flex justify-between align-center mt-4">
          <span class="text-muted">Showing page {{ currentPage() }} of {{ totalPages() }} (Total: {{ totalCount() }})</span>
          <div class="d-flex gap-2">
            <button (click)="goToPage(currentPage() - 1)" [disabled]="currentPage() === 1" class="btn btn-outline btn-sm">◀ Previous</button>
            <button (click)="goToPage(currentPage() + 1)" [disabled]="currentPage() === totalPages()" class="btn btn-outline btn-sm">Next ▶</button>
          </div>
        </div>
      }
    </div>

    <!-- Order Detail Modal -->
    @if (showDetailsModal() && selectedOrder()) {
      <div class="modal-backdrop">
        <div class="modal-container">
          <div class="modal-title-bar">
            <h3>📦 Order Receipt #{{ selectedOrder()?.id }}</h3>
            <button (click)="closeDetailsModal()" class="modal-close">&times;</button>
          </div>
          <div class="modal-body">
            <div class="receipt-section">
              <h4>Customer Information</h4>
              <p><strong>Name:</strong> {{ selectedOrder()?.customer?.name || '-' }}</p>
              <p><strong>Email:</strong> {{ selectedOrder()?.customer?.email || '-' }}</p>
              <p><strong>Phone:</strong> {{ selectedOrder()?.customer?.phone || '-' }}</p>
            </div>

            <div class="receipt-divider"></div>

            <div class="receipt-section">
              <h4>Product Details</h4>
              <p><strong>Name:</strong> {{ selectedOrder()?.product?.name }}</p>
              <p><strong>Unit Purchase Price:</strong> ₹{{ selectedOrder()?.purchasePrice | number:'1.2-2' }}</p>
              <p><strong>Quantity Ordered:</strong> {{ selectedOrder()?.quantity }}</p>
            </div>

            <div class="receipt-divider"></div>

            <div class="receipt-section text-right">
              <p class="total-label">Total Payment</p>
              <p class="total-value">₹{{ selectedOrder()?.totalPrice | number:'1.2-2' }}</p>
            </div>

            <div class="receipt-divider"></div>

            <div class="receipt-section">
              <p><strong>Placed At:</strong> {{ selectedOrder()?.createdAt | date:'medium' }}</p>
              <p><strong>Last Updated:</strong> {{ selectedOrder()?.updatedAt | date:'medium' }}</p>
            </div>
          </div>
          <div class="modal-footer">
            <button (click)="closeDetailsModal()" class="btn btn-primary">Close</button>
          </div>
        </div>
      </div>
    }

    <!-- Toast Notifications -->
    @if (toast()) {
      <div class="toast-container">
        <div class="toast" [class]="'toast-' + toast()?.type">
          <span>{{ toast()?.message }}</span>
        </div>
      </div>
    }
  `,
  styles: [`
    .receipt-section {
      margin-bottom: 1rem;
    }
    .receipt-section h4 {
      font-size: 0.9rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--text-muted);
      margin-bottom: 0.5rem;
    }
    .receipt-section p {
      font-size: 0.9rem;
      margin-bottom: 0.25rem;
    }
    .receipt-divider {
      height: 1px;
      background: var(--border-color);
      margin: 1rem 0;
      border-bottom: 1px dashed #cbd5e1;
    }
    .total-label {
      font-size: 0.85rem;
      color: var(--text-muted);
    }
    .total-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--primary);
    }
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
    .justify-end {
      justify-content: flex-end;
    }
  `]
})
export class OrdersComponent implements OnInit {
  private readonly apiService = inject(AdminApiService);

  orders = signal<any[]>([]);
  loading = signal(true);
  searchQuery = '';

  // Pagination
  currentPage = signal(1);
  totalPages = signal(1);
  totalCount = signal(0);
  pageSize = 10;

  // Details Modal
  showDetailsModal = signal(false);
  selectedOrder = signal<any | null>(null);

  // Toast
  toast = signal<{ message: string; type: 'success' | 'danger' | 'info' | 'warning' } | null>(null);

  ngOnInit(): void {
    this.loadOrders();
  }

  showToast(message: string, type: 'success' | 'danger' | 'info' | 'warning' = 'info') {
    this.toast.set({ message, type });
    setTimeout(() => this.toast.set(null), 3000);
  }

  loadOrders(): void {
    this.loading.set(true);
    this.apiService.getOrders(this.currentPage(), this.pageSize).subscribe({
      next: (res: any) => {
        let list = res.data || [];
        if (this.searchQuery) {
          const query = this.searchQuery.toLowerCase();
          list = list.filter((o: any) => 
            (o.customer?.name && o.customer.name.toLowerCase().includes(query)) ||
            (o.customer?.email && o.customer.email.toLowerCase().includes(query))
          );
        }
        this.orders.set(list);
        this.totalCount.set(res.total || list.length);
        this.totalPages.set(res.totalPages || Math.ceil((res.total || list.length) / this.pageSize));
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.showToast('Failed to load sales orders.', 'danger');
      }
    });
  }

  onSearch(): void {
    this.currentPage.set(1);
    this.loadOrders();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.currentPage.set(page);
    this.loadOrders();
  }

  viewDetails(id: number): void {
    this.apiService.getOrderById(id).subscribe({
      next: (res) => {
        this.selectedOrder.set(res);
        this.showDetailsModal.set(true);
      },
      error: () => {
        this.showToast('Failed to load order details.', 'danger');
      }
    });
  }

  closeDetailsModal(): void {
    this.showDetailsModal.set(false);
    this.selectedOrder.set(null);
  }

  confirmDelete(order: any): void {
    if (confirm(`Are you sure you want to delete/cancel order #${order.id}?`)) {
      this.apiService.deleteOrder(order.id).subscribe({
        next: () => {
          this.showToast('Order successfully deleted/canceled.', 'success');
          this.loadOrders();
        },
        error: (err) => {
          this.showToast(err.error?.message || 'Failed to delete order.', 'danger');
        }
      });
    }
  }
}
