import { Component, inject, OnInit, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminApiService } from '../../services/admin-api.service';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [DecimalPipe, FormsModule],
  template: `
    <div class="products-container">
      <div class="d-flex justify-between align-center mb-4">
        <h1>💊 Products Management</h1>
        <button (click)="openAddModal()" class="btn btn-primary">➕ Add Product</button>
      </div>

      <!-- Filters & Search -->
      <div class="search-bar-container card">
        <div class="search-input-wrapper">
          <span class="search-icon">🔍</span>
          <input 
            type="text" 
            [(ngModel)]="searchQuery" 
            (input)="onSearch()"
            class="form-control" 
            placeholder="Search products..."
          />
        </div>
        <div class="filter-group d-flex gap-2">
          <select [(ngModel)]="selectedCategory" (change)="onFilterChange()" class="form-control" style="min-width: 180px;">
            <option [value]="0">All Categories</option>
            @for (cat of categories(); track cat.id) {
              <option [value]="cat.id">{{ cat.categoryName }}</option>
            }
          </select>
        </div>
      </div>

      <!-- Products Table -->
      @if (loading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Loading products list...</p>
        </div>
      } @else if (products().length === 0) {
        <div class="empty-state">
          <div class="empty-state-icon">💊</div>
          <p>No products found matching the criteria.</p>
        </div>
      } @else {
        <div class="table-responsive">
          <table class="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Image</th>
                <th>Product Name</th>
                <th>Price</th>
                <th>Discount Price</th>
                <th>Category</th>
                <th>Summary</th>
                <th class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (p of products(); track p.id) {
                <tr>
                  <td><strong>#{{ p.id }}</strong></td>
                  <td>
                    @if (p.image) {
                      <img [src]="p.image" alt="{{ p.name }}" class="prod-thumb" (error)="onImgError($event)" />
                    } @else {
                      <span class="no-img">No image</span>
                    }
                  </td>
                  <td>
                    <div style="font-weight: 600;">{{ p.name }}</div>
                  </td>
                  <td>₹{{ p.price | number:'1.2-2' }}</td>
                  <td>
                    @if (p.discountedPrice) {
                      <span class="badge badge-success">₹{{ p.discountedPrice | number:'1.2-2' }}</span>
                    } @else {
                      <span class="text-muted">-</span>
                    }
                  </td>
                  <td>
                    <span class="badge badge-info">{{ getCategoryName(p.categoryId) }}</span>
                  </td>
                  <td>
                    <div class="summary-cell" [title]="p.summary">{{ p.summary || '-' }}</div>
                  </td>
                  <td class="text-right">
                    <div class="d-flex gap-2 justify-end">
                      <button (click)="openEditModal(p)" class="btn btn-outline btn-sm">✏️ Edit</button>
                      <button (click)="confirmDelete(p)" class="btn btn-danger btn-sm">🗑️ Delete</button>
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

    <!-- Product Create/Edit Modal -->
    @if (showModal()) {
      <div class="modal-backdrop">
        <div class="modal-container large">
          <div class="modal-title-bar">
            <h3>{{ isEditMode() ? '✏️ Edit Product' : '➕ Add New Product' }}</h3>
            <button (click)="closeModal()" class="modal-close">&times;</button>
          </div>
          <form (submit)="saveProduct($event)">
            <div class="modal-body">
              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label">Product Name *</label>
                  <input type="text" [(ngModel)]="currentProduct.name" name="name" class="form-control" required />
                </div>
                <div class="form-group">
                  <label class="form-label">Category *</label>
                  <select [(ngModel)]="currentProduct.categoryId" name="categoryId" class="form-control" required>
                    <option [value]="undefined" disabled>Select a category</option>
                    @for (cat of categories(); track cat.id) {
                      <option [value]="cat.id">{{ cat.categoryName }}</option>
                    }
                  </select>
                </div>
              </div>

              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label">Retail Price (₹) *</label>
                  <input type="number" [(ngModel)]="currentProduct.price" name="price" class="form-control" step="0.01" required />
                </div>
                <div class="form-group">
                  <label class="form-label">Discounted Price (₹)</label>
                  <input type="number" [(ngModel)]="currentProduct.discountedPrice" name="discountedPrice" class="form-control" step="0.01" />
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Short Summary</label>
                <input type="text" [(ngModel)]="currentProduct.summary" name="summary" class="form-control" placeholder="Brief tagline or summary" />
              </div>

              <div class="form-group">
                <label class="form-label">Detailed Description</label>
                <textarea [(ngModel)]="currentProduct.description" name="description" class="form-control" rows="3"></textarea>
              </div>

              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label">Key Uses</label>
                  <textarea [(ngModel)]="currentProduct.uses" name="uses" class="form-control" rows="2"></textarea>
                </div>
                <div class="form-group">
                  <label class="form-label">Side Effects</label>
                  <textarea [(ngModel)]="currentProduct.sideEffects" name="sideEffects" class="form-control" rows="2"></textarea>
                </div>
              </div>

              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label">Direction For Use</label>
                  <textarea [(ngModel)]="currentProduct.directionForUse" name="directionForUse" class="form-control" rows="2"></textarea>
                </div>
                <div class="form-group">
                  <label class="form-label">Quick Tips</label>
                  <textarea [(ngModel)]="currentProduct.quickTips" name="quickTips" class="form-control" rows="2"></textarea>
                </div>
              </div>

              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label">Storage & Disposal</label>
                  <input type="text" [(ngModel)]="currentProduct.storageDisposal" name="storageDisposal" class="form-control" />
                </div>
                <div class="form-group">
                  <label class="form-label">Dosage Instructions</label>
                  <input type="text" [(ngModel)]="currentProduct.dosage" name="dosage" class="form-control" />
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Mode of Action</label>
                <input type="text" [(ngModel)]="currentProduct.modeOfAction" name="modeOfAction" class="form-control" />
              </div>

              <div class="form-group">
                <label class="form-label">Image URL</label>
                <input type="text" [(ngModel)]="currentProduct.image" name="image" class="form-control" placeholder="https://example.com/product.png" />
                @if (currentProduct.image) {
                  <div class="img-preview-wrap">
                    <img [src]="currentProduct.image" class="img-preview" (error)="onImageFileChange($event)" alt="Preview" />
                  </div>
                }
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" (click)="closeModal()" class="btn btn-outline" [disabled]="submitting()">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="submitting()">
                @if (submitting()) { Saving... } @else { Save Product }
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
    .summary-cell {
      max-width: 200px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
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
    .justify-end { justify-content: flex-end; }
    .prod-thumb {
      width: 48px; height: 48px;
      object-fit: cover;
      border-radius: 8px;
      border: 1px solid var(--border-color);
    }
    .no-img { font-size: 12px; color: var(--text-muted); }
    .img-preview-wrap { margin-top: 8px; }
    .img-preview {
      width: 80px; height: 80px;
      object-fit: cover;
      border-radius: 8px;
      border: 1px solid var(--border-color);
    }
  `]
})
export class ProductsComponent implements OnInit {
  private readonly apiService = inject(AdminApiService);

  products = signal<any[]>([]);
  categories = signal<any[]>([]);
  loading = signal(true);
  submitting = signal(false);
  
  // Search & Filtering
  searchQuery = '';
  selectedCategory = 0;

  // Pagination
  currentPage = signal(1);
  totalPages = signal(1);
  totalCount = signal(0);
  pageSize = 10;

  // Modal Control
  showModal = signal(false);
  isEditMode = signal(false);
  currentProduct: any = {};

  // Toasts
  toast = signal<{ message: string; type: 'success' | 'danger' | 'info' | 'warning' } | null>(null);

  ngOnInit(): void {
    this.loadCategories();
    this.loadProducts();
  }

  showToast(message: string, type: 'success' | 'danger' | 'info' | 'warning' = 'info') {
    this.toast.set({ message, type });
    setTimeout(() => this.toast.set(null), 3000);
  }

  loadCategories(): void {
    this.apiService.getCategories().subscribe({
      next: (res) => this.categories.set(res),
      error: (err) => this.showToast('Failed to load categories', 'danger')
    });
  }

  loadProducts(): void {
    this.loading.set(true);
    this.apiService.getProducts(this.currentPage(), this.pageSize).subscribe({
      next: (res: any) => {
        let filtered = res.data || [];
        
        // Frontend filtering if backend filter isn't active
        if (this.selectedCategory > 0) {
          filtered = filtered.filter((p: any) => p.categoryId === Number(this.selectedCategory));
        }
        if (this.searchQuery) {
          const query = this.searchQuery.toLowerCase();
          filtered = filtered.filter((p: any) => 
            p.name.toLowerCase().includes(query) || 
            (p.summary && p.summary.toLowerCase().includes(query))
          );
        }

        this.products.set(filtered);
        this.totalCount.set(res.total || filtered.length);
        this.totalPages.set(res.totalPages || Math.ceil((res.total || filtered.length) / this.pageSize));
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.showToast('Failed to load products list', 'danger');
      }
    });
  }

  getCategoryName(id: number): string {
    const category = this.categories().find(c => c.id === id);
    return category ? category.categoryName : `Category #${id}`;
  }

  onSearch(): void {
    this.currentPage.set(1);
    this.loadProducts();
  }

  onFilterChange(): void {
    this.currentPage.set(1);
    this.loadProducts();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.currentPage.set(page);
    this.loadProducts();
  }

  openAddModal(): void {
    this.isEditMode.set(false);
    this.currentProduct = {
      name: '',
      price: 0,
      discountedPrice: 0,
      categoryId: this.categories().length > 0 ? this.categories()[0].id : undefined,
      summary: '',
      description: '',
      uses: '',
      sideEffects: '',
      directionForUse: '',
      quickTips: '',
      storageDisposal: '',
      dosage: '',
      modeOfAction: '',
      image: ''
    };
    this.showModal.set(true);
  }

  onImgError(event: Event): void {
    (event.target as HTMLImageElement).style.display = 'none';
  }

  onImageFileChange(event: Event): void {
    this.currentProduct.image = '';
  }

  openEditModal(product: any): void {
    this.isEditMode.set(true);
    this.currentProduct = { ...product };
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
  }

  saveProduct(event: Event): void {
    event.preventDefault();
    if (!this.currentProduct.name || !this.currentProduct.price || !this.currentProduct.categoryId) {
      this.showToast('Please fill in all required fields.', 'warning');
      return;
    }

    this.submitting.set(true);
    if (this.isEditMode()) {
      // Put/Update product
      this.apiService.updateProduct(this.currentProduct.id, this.currentProduct).subscribe({
        next: () => {
          this.submitting.set(false);
          this.showModal.set(false);
          this.showToast('Product updated successfully!', 'success');
          this.loadProducts();
        },
        error: (err) => {
          this.submitting.set(false);
          this.showToast(err.error?.message || 'Failed to update product.', 'danger');
        }
      });
    } else {
      // Create product
      this.apiService.createProduct(this.currentProduct).subscribe({
        next: () => {
          this.submitting.set(false);
          this.showModal.set(false);
          this.showToast('Product created successfully!', 'success');
          this.loadProducts();
        },
        error: (err) => {
          this.submitting.set(false);
          this.showToast(err.error?.message || 'Failed to create product.', 'danger');
        }
      });
    }
  }

  confirmDelete(product: any): void {
    if (confirm(`Are you sure you want to delete the product "${product.name}"?`)) {
      this.apiService.deleteProduct(product.id).subscribe({
        next: () => {
          this.showToast('Product deleted successfully.', 'success');
          this.loadProducts();
        },
        error: (err) => {
          this.showToast(err.error?.message || 'Failed to delete product.', 'danger');
        }
      });
    }
  }
}
