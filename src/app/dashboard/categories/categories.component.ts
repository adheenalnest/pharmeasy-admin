import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminApiService } from '../../services/admin-api.service';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="categories-container">
      <div class="d-flex justify-between align-center mb-4">
        <h1>📁 Categories Management</h1>
        <button (click)="openAddModal()" class="btn btn-primary">➕ Add Category</button>
      </div>

      <!-- Search Bar -->
      <div class="search-bar-container card">
        <div class="search-input-wrapper">
          <span class="search-icon">🔍</span>
          <input 
            type="text" 
            [(ngModel)]="searchQuery" 
            class="form-control" 
            placeholder="Search categories..."
          />
        </div>
      </div>

      <!-- Categories Table -->
      @if (loading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Loading categories list...</p>
        </div>
      } @else if (filteredCategories().length === 0) {
        <div class="empty-state">
          <div class="empty-state-icon">📁</div>
          <p>No categories found.</p>
        </div>
      } @else {
        <div class="table-responsive">
          <table class="table">
            <thead>
              <tr>
                <th>Category ID</th>
                <th>Image</th>
                <th>Category Name</th>
                <th class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (c of filteredCategories(); track c.id) {
                <tr>
                  <td><strong>#{{ c.id }}</strong></td>
                  <td>
                    @if (c.image) {
                      <img [src]="c.image" alt="{{ c.categoryName }}" class="cat-thumb" (error)="onImgError($event)" />
                    } @else {
                      <span class="no-img">No image</span>
                    }
                  </td>
                  <td>
                    <span style="font-weight: 600;">{{ c.categoryName }}</span>
                  </td>
                  <td class="text-right">
                    <div class="d-flex gap-2 justify-end">
                      <button (click)="openEditModal(c)" class="btn btn-outline btn-sm">✏️ Rename</button>
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

    <!-- Category Modal -->
    @if (showModal()) {
      <div class="modal-backdrop">
        <div class="modal-container">
          <div class="modal-title-bar">
            <h3>{{ isEditMode() ? '✏️ Rename Category' : '➕ Add New Category' }}</h3>
            <button (click)="closeModal()" class="modal-close">&times;</button>
          </div>
          <form (submit)="saveCategory($event)">
            <div class="modal-body">
              <div class="form-group">
                <label class="form-label">Category Name *</label>
                <input
                  type="text"
                  [(ngModel)]="currentCategoryName"
                  name="categoryName"
                  class="form-control"
                  placeholder="e.g. Health Devices"
                  required
                />
              </div>
              <div class="form-group">
                <label class="form-label">Image URL</label>
                <input
                  type="text"
                  [(ngModel)]="currentCategoryImage"
                  name="image"
                  class="form-control"
                  placeholder="https://example.com/image.png"
                />
                @if (currentCategoryImage) {
                  <div class="img-preview-wrap">
                    <img [src]="currentCategoryImage" class="img-preview" (error)="clearImagePreview()" alt="Preview" />
                  </div>
                }
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" (click)="closeModal()" class="btn btn-outline" [disabled]="submitting()">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="submitting()">
                @if (submitting()) { Saving... } @else { Save Category }
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
    .justify-end { justify-content: flex-end; }
    .cat-thumb {
      width: 48px; height: 48px;
      object-fit: cover;
      border-radius: 8px;
      border: 1px solid var(--border-color);
    }
    .no-img {
      font-size: 12px; color: var(--text-muted);
    }
    .img-preview-wrap {
      margin-top: 8px;
    }
    .img-preview {
      width: 80px; height: 80px;
      object-fit: cover;
      border-radius: 8px;
      border: 1px solid var(--border-color);
    }
  `]
})
export class CategoriesComponent implements OnInit {
  private readonly apiService = inject(AdminApiService);

  categories = signal<any[]>([]);
  loading = signal(true);
  submitting = signal(false);
  searchQuery = '';

  // Modal State
  showModal = signal(false);
  isEditMode = signal(false);
  currentCategoryId: number | null = null;
  currentCategoryName = '';
  currentCategoryImage = '';

  // Toast
  toast = signal<{ message: string; type: 'success' | 'danger' | 'info' | 'warning' } | null>(null);

  ngOnInit(): void {
    this.loadCategories();
  }

  showToast(message: string, type: 'success' | 'danger' | 'info' | 'warning' = 'info') {
    this.toast.set({ message, type });
    setTimeout(() => this.toast.set(null), 3000);
  }

  loadCategories(): void {
    this.loading.set(true);
    this.apiService.getCategories().subscribe({
      next: (res) => {
        this.categories.set(res || []);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.showToast('Failed to load categories list.', 'danger');
      }
    });
  }

  filteredCategories() {
    const query = this.searchQuery.trim().toLowerCase();
    if (!query) return this.categories();
    return this.categories().filter(c => c.categoryName.toLowerCase().includes(query));
  }

  openAddModal(): void {
    this.isEditMode.set(false);
    this.currentCategoryId = null;
    this.currentCategoryName = '';
    this.currentCategoryImage = '';
    this.showModal.set(true);
  }

  openEditModal(category: any): void {
    this.isEditMode.set(true);
    this.currentCategoryId = category.id;
    this.currentCategoryName = category.categoryName;
    this.currentCategoryImage = category.image ?? '';
    this.showModal.set(true);
  }

  onImgError(event: Event): void {
    (event.target as HTMLImageElement).style.display = 'none';
  }

  clearImagePreview(): void {
    this.currentCategoryImage = '';
  }

  closeModal(): void {
    this.showModal.set(false);
  }

  saveCategory(event: Event): void {
    event.preventDefault();
    if (!this.currentCategoryName.trim()) {
      this.showToast('Category name is required.', 'warning');
      return;
    }

    this.submitting.set(true);
    const payload = { categoryName: this.currentCategoryName, image: this.currentCategoryImage };

    if (this.isEditMode() && this.currentCategoryId !== null) {
      // Put/Update category
      this.apiService.updateCategory(this.currentCategoryId, payload).subscribe({
        next: () => {
          this.submitting.set(false);
          this.showModal.set(false);
          this.showToast('Category renamed successfully!', 'success');
          this.loadCategories();
        },
        error: (err) => {
          this.submitting.set(false);
          this.showToast(err.error?.message || 'Failed to rename category.', 'danger');
        }
      });
    } else {
      // Create category
      this.apiService.createCategory(payload).subscribe({
        next: () => {
          this.submitting.set(false);
          this.showModal.set(false);
          this.showToast('Category created successfully!', 'success');
          this.loadCategories();
        },
        error: (err) => {
          this.submitting.set(false);
          this.showToast(err.error?.message || 'Failed to create category.', 'danger');
        }
      });
    }
  }

  confirmDelete(category: any): void {
    if (confirm(`Are you sure you want to delete category "${category.categoryName}"? This will fail if products belong to it.`)) {
      this.apiService.deleteCategory(category.id).subscribe({
        next: () => {
          this.showToast('Category deleted successfully.', 'success');
          this.loadCategories();
        },
        error: (err) => {
          this.showToast(err.error?.message || 'Failed to delete category.', 'danger');
        }
      });
    }
  }
}
