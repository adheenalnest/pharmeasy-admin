import { Component, inject, OnInit, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminApiService } from '../../services/admin-api.service';

@Component({
  selector: 'app-coupons',
  standalone: true,
  imports: [DecimalPipe, FormsModule],
  template: `
    <div class="coupons-container">
      <div class="d-flex justify-between align-center mb-4">
        <h1>🏷️ Coupons Management</h1>
        <button (click)="openAddModal()" class="btn btn-primary">➕ Add Coupon</button>
      </div>

      <!-- Search bar -->
      <div class="search-bar-container card">
        <div class="search-input-wrapper">
          <span class="search-icon">🔍</span>
          <input 
            type="text" 
            [(ngModel)]="searchQuery" 
            class="form-control" 
            placeholder="Search coupons..."
          />
        </div>
      </div>

      <!-- Coupons Table -->
      @if (loading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Loading coupons list...</p>
        </div>
      } @else if (filteredCoupons().length === 0) {
        <div class="empty-state">
          <div class="empty-state-icon">🏷️</div>
          <p>No coupons found.</p>
        </div>
      } @else {
        <div class="table-responsive">
          <table class="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Coupon Code / Name</th>
                <th>Discount Display</th>
                <th>Type</th>
                <th>Calculated Value</th>
                <th>Usage Limit</th>
                <th class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (c of filteredCoupons(); track c.id) {
                <tr>
                  <td><strong>#{{ c.id }}</strong></td>
                  <td>
                    <span class="coupon-tag-code">{{ c.couponName }}</span>
                  </td>
                  <td>
                    <span class="badge badge-success">{{ c.discount }}</span>
                  </td>
                  <td>
                    @if (c.couponType === 0 || c.couponType === 'Percentage') {
                      <span class="badge badge-info">Percentage (%)</span>
                    } @else {
                      <span class="badge badge-warning">Fixed Amount (₹)</span>
                    }
                  </td>
                  <td>
                    <strong>
                      {{ c.couponType === 0 || c.couponType === 'Percentage' ? c.value + '%' : '₹' + (c.value | number:'1.2-2') }}
                    </strong>
                  </td>
                  <td>
                    @if (c.usageLimit > 0) {
                      <span>{{ c.usageLimit }} times</span>
                    } @else {
                      <span class="text-muted">Unlimited</span>
                    }
                  </td>
                  <td class="text-right">
                    <div class="d-flex gap-2 justify-end">
                      <button (click)="openEditModal(c)" class="btn btn-outline btn-sm">✏️ Edit</button>
                      <button (click)="confirmDelete(c)" class="btn btn-danger btn-sm">🗑️ Delete</button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>

    <!-- Coupon Add/Edit Modal -->
    @if (showModal()) {
      <div class="modal-backdrop">
        <div class="modal-container">
          <div class="modal-title-bar">
            <h3>{{ isEditMode() ? '✏️ Edit Coupon' : '➕ Add New Coupon' }}</h3>
            <button (click)="closeModal()" class="modal-close">&times;</button>
          </div>
          <form (submit)="saveCoupon($event)">
            <div class="modal-body">
              <div class="form-group">
                <label class="form-label">Coupon Code (Uppercase, No spaces) *</label>
                <input 
                  type="text" 
                  [(ngModel)]="currentCoupon.couponName" 
                  (ngModelChange)="currentCoupon.couponName = $event.toUpperCase()"
                  name="couponName"
                  class="form-control" 
                  placeholder="e.g. HEALTHY20"
                  required 
                />
              </div>

              <div class="form-group">
                <label class="form-label">Discount Description (Display text) *</label>
                <input 
                  type="text" 
                  [(ngModel)]="currentCoupon.discount" 
                  name="discount"
                  class="form-control" 
                  placeholder="e.g. ₹200 OFF on healthcare devices"
                  required 
                />
              </div>

              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label">Coupon Type *</label>
                  <select [(ngModel)]="currentCoupon.couponType" name="couponType" class="form-control" required>
                    <option [value]="0">Percentage (%)</option>
                    <option [value]="1">Fixed Amount (₹)</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Value *</label>
                  <input 
                    type="number" 
                    [(ngModel)]="currentCoupon.value" 
                    name="value"
                    class="form-control" 
                    step="0.01"
                    min="0"
                    required 
                  />
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Usage Limit (0 for Unlimited)</label>
                <input 
                  type="number" 
                  [(ngModel)]="currentCoupon.usageLimit" 
                  name="usageLimit"
                  class="form-control" 
                  min="0"
                />
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" (click)="closeModal()" class="btn btn-outline" [disabled]="submitting()">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="submitting()">
                @if (submitting()) { Saving... } @else { Save Coupon }
              </button>
            </div>
          </form>
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
    .coupon-tag-code {
      font-family: monospace;
      font-weight: 700;
      font-size: 0.95rem;
      background: #f1f5f9;
      color: var(--secondary);
      border: 1px dashed #cbd5e1;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
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
export class CouponsComponent implements OnInit {
  private readonly apiService = inject(AdminApiService);

  coupons = signal<any[]>([]);
  loading = signal(true);
  submitting = signal(false);
  searchQuery = '';

  // Modal State
  showModal = signal(false);
  isEditMode = signal(false);
  currentCoupon: any = {};

  // Toast
  toast = signal<{ message: string; type: 'success' | 'danger' | 'info' | 'warning' } | null>(null);

  ngOnInit(): void {
    this.loadCoupons();
  }

  showToast(message: string, type: 'success' | 'danger' | 'info' | 'warning' = 'info') {
    this.toast.set({ message, type });
    setTimeout(() => this.toast.set(null), 3000);
  }

  loadCoupons(): void {
    this.loading.set(true);
    this.apiService.getCoupons().subscribe({
      next: (res) => {
        this.coupons.set(res || []);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.showToast('Failed to load coupons list.', 'danger');
      }
    });
  }

  filteredCoupons() {
    const query = this.searchQuery.trim().toLowerCase();
    if (!query) return this.coupons();
    return this.coupons().filter(c => 
      c.couponName.toLowerCase().includes(query) || 
      c.discount.toLowerCase().includes(query)
    );
  }

  openAddModal(): void {
    this.isEditMode.set(false);
    this.currentCoupon = {
      couponName: '',
      discount: '',
      couponType: 0,
      value: 0,
      usageLimit: 0
    };
    this.showModal.set(true);
  }

  openEditModal(coupon: any): void {
    this.isEditMode.set(true);
    // Convert couponType enum label to integer if backend returns it as string/label
    let typeInt = coupon.couponType;
    if (typeof typeInt === 'string') {
      typeInt = typeInt === 'Percentage' ? 0 : 1;
    }
    this.currentCoupon = { ...coupon, couponType: typeInt };
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
  }

  saveCoupon(event: Event): void {
    event.preventDefault();
    if (!this.currentCoupon.couponName.trim() || !this.currentCoupon.discount.trim()) {
      this.showToast('Code and Description are required.', 'warning');
      return;
    }

    this.submitting.set(true);
    // Convert couponType to number
    this.currentCoupon.couponType = Number(this.currentCoupon.couponType);
    this.currentCoupon.value = Number(this.currentCoupon.value);
    this.currentCoupon.usageLimit = Number(this.currentCoupon.usageLimit || 0);

    if (this.isEditMode()) {
      // Patch coupon
      this.apiService.patchCoupon(this.currentCoupon.id, this.currentCoupon).subscribe({
        next: () => {
          this.submitting.set(false);
          this.showModal.set(false);
          this.showToast('Coupon updated successfully!', 'success');
          this.loadCoupons();
        },
        error: (err) => {
          this.submitting.set(false);
          this.showToast(err.error?.message || 'Failed to update coupon.', 'danger');
        }
      });
    } else {
      // Create coupon
      this.apiService.createCoupon(this.currentCoupon).subscribe({
        next: () => {
          this.submitting.set(false);
          this.showModal.set(false);
          this.showToast('Coupon created successfully!', 'success');
          this.loadCoupons();
        },
        error: (err) => {
          this.submitting.set(false);
          this.showToast(err.error?.message || 'Failed to create coupon.', 'danger');
        }
      });
    }
  }

  confirmDelete(coupon: any): void {
    if (confirm(`Are you sure you want to delete the coupon code "${coupon.couponName}"?`)) {
      this.apiService.deleteCoupon(coupon.id).subscribe({
        next: () => {
          this.showToast('Coupon code deleted.', 'success');
          this.loadCoupons();
        },
        error: (err) => {
          this.showToast(err.error?.message || 'Failed to delete coupon.', 'danger');
        }
      });
    }
  }
}
