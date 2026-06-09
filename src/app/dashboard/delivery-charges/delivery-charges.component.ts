import { Component, inject, OnInit, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminApiService } from '../../services/admin-api.service';

@Component({
  selector: 'app-delivery-charges',
  standalone: true,
  imports: [DecimalPipe, FormsModule],
  template: `
    <div class="delivery-charges-container">
      <div class="d-flex justify-between align-center mb-4">
        <h1>🚚 Delivery Charges & Pincodes</h1>
        <button (click)="openAddModal()" class="btn btn-primary">➕ Add Pincode Config</button>
      </div>

      <!-- Search bar -->
      <div class="search-bar-container card">
        <div class="search-input-wrapper">
          <span class="search-icon">🔍</span>
          <input 
            type="text" 
            [(ngModel)]="searchQuery" 
            class="form-control" 
            placeholder="Search by pincode..."
          />
        </div>
      </div>

      <!-- Charges Table -->
      @if (loading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Loading pincode list...</p>
        </div>
      } @else if (filteredCharges().length === 0) {
        <div class="empty-state">
          <div class="empty-state-icon">🚚</div>
          <p>No pincode configs found.</p>
        </div>
      } @else {
        <div class="table-responsive">
          <table class="table">
            <thead>
              <tr>
                <th>Rule ID</th>
                <th>Pincode</th>
                <th>Delivery Charge</th>
                <th>Service Status</th>
                <th class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (c of filteredCharges(); track c.id) {
                <tr>
                  <td><strong>#{{ c.id }}</strong></td>
                  <td>
                    <span class="pincode-badge">{{ c.pincode }}</span>
                  </td>
                  <td><strong>₹{{ c.charge | number:'1.2-2' }}</strong></td>
                  <td>
                    @if (c.isDeliverable) {
                      <span class="badge badge-success">🟢 Active Delivery</span>
                    } @else {
                      <span class="badge badge-danger">🔴 Not Deliverable</span>
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

    <!-- Add/Edit Modal -->
    @if (showModal()) {
      <div class="modal-backdrop">
        <div class="modal-container">
          <div class="modal-title-bar">
            <h3>{{ isEditMode() ? '✏️ Edit Pincode Configuration' : '➕ Add Pincode Configuration' }}</h3>
            <button (click)="closeModal()" class="modal-close">&times;</button>
          </div>
          <form (submit)="saveCharge($event)">
            <div class="modal-body">
              <div class="form-group">
                <label class="form-label">Pincode (6 digits) *</label>
                <input 
                  type="text" 
                  [(ngModel)]="currentCharge.pincode" 
                  name="pincode"
                  class="form-control" 
                  placeholder="e.g. 560001"
                  maxlength="6"
                  required 
                />
              </div>

              <div class="form-group">
                <label class="form-label">Delivery Fee (₹) *</label>
                <input 
                  type="number" 
                  [(ngModel)]="currentCharge.charge" 
                  name="charge"
                  class="form-control" 
                  step="0.01"
                  min="0"
                  required 
                />
              </div>

              <div class="form-group">
                <label class="form-label">Serviceability Status</label>
                <div class="checkbox-wrapper">
                  <input 
                    type="checkbox" 
                    [(ngModel)]="currentCharge.isDeliverable" 
                    name="isDeliverable" 
                    id="isDeliverableCheck"
                  />
                  <label for="isDeliverableCheck">Enable orders & deliveries for this pincode</label>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" (click)="closeModal()" class="btn btn-outline" [disabled]="submitting()">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="submitting()">
                @if (submitting()) { Saving... } @else { Save Configuration }
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
    .pincode-badge {
      font-family: monospace;
      font-size: 1rem;
      font-weight: 700;
      color: var(--primary);
      background-color: var(--primary-light);
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
    }
    .checkbox-wrapper {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 0;
    }
    .checkbox-wrapper label {
      font-size: 0.875rem;
      cursor: pointer;
      user-select: none;
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
export class DeliveryChargesComponent implements OnInit {
  private readonly apiService = inject(AdminApiService);

  charges = signal<any[]>([]);
  loading = signal(true);
  submitting = signal(false);
  searchQuery = '';

  // Modal control
  showModal = signal(false);
  isEditMode = signal(false);
  currentCharge: any = {};

  // Toast
  toast = signal<{ message: string; type: 'success' | 'danger' | 'info' | 'warning' } | null>(null);

  ngOnInit(): void {
    this.loadCharges();
  }

  showToast(message: string, type: 'success' | 'danger' | 'info' | 'warning' = 'info') {
    this.toast.set({ message, type });
    setTimeout(() => this.toast.set(null), 3000);
  }

  loadCharges(): void {
    this.loading.set(true);
    this.apiService.getDeliveryCharges().subscribe({
      next: (res) => {
        this.charges.set(res || []);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.showToast('Failed to load delivery charges.', 'danger');
      }
    });
  }

  filteredCharges() {
    const query = this.searchQuery.trim();
    if (!query) return this.charges();
    return this.charges().filter(c => c.pincode.includes(query));
  }

  openAddModal(): void {
    this.isEditMode.set(false);
    this.currentCharge = {
      pincode: '',
      charge: 0,
      isDeliverable: true
    };
    this.showModal.set(true);
  }

  openEditModal(charge: any): void {
    this.isEditMode.set(true);
    this.currentCharge = { ...charge };
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
  }

  saveCharge(event: Event): void {
    event.preventDefault();
    if (!this.currentCharge.pincode.trim()) {
      this.showToast('Pincode is required.', 'warning');
      return;
    }

    this.submitting.set(true);
    this.currentCharge.charge = Number(this.currentCharge.charge);

    if (this.isEditMode()) {
      // Patch rule
      this.apiService.patchDeliveryCharge(this.currentCharge.id, this.currentCharge).subscribe({
        next: () => {
          this.submitting.set(false);
          this.showModal.set(false);
          this.showToast('Configuration updated successfully!', 'success');
          this.loadCharges();
        },
        error: (err) => {
          this.submitting.set(false);
          this.showToast(err.error?.message || 'Failed to update pincode configuration.', 'danger');
        }
      });
    } else {
      // Create rule
      this.apiService.createDeliveryCharge(this.currentCharge).subscribe({
        next: () => {
          this.submitting.set(false);
          this.showModal.set(false);
          this.showToast('Configuration created successfully!', 'success');
          this.loadCharges();
        },
        error: (err) => {
          this.submitting.set(false);
          this.showToast(err.error?.message || 'Failed to create pincode configuration.', 'danger');
        }
      });
    }
  }

  confirmDelete(charge: any): void {
    if (confirm(`Are you sure you want to delete delivery configuration for pincode ${charge.pincode}?`)) {
      this.apiService.deleteDeliveryCharge(charge.id).subscribe({
        next: () => {
          this.showToast('Delivery configuration deleted.', 'success');
          this.loadCharges();
        },
        error: (err) => {
          this.showToast(err.error?.message || 'Failed to delete config.', 'danger');
        }
      });
    }
  }
}
