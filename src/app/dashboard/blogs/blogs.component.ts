import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminApiService } from '../../services/admin-api.service';

@Component({
  selector: 'app-blogs',
  standalone: true,
  imports: [DatePipe, FormsModule],
  template: `
    <div class="blogs-container">
      <div class="d-flex justify-between align-center mb-4">
        <h1>✍️ Blogs & Health Insights</h1>
        <button (click)="openAddModal()" class="btn btn-primary">➕ Write Blog Post</button>
      </div>

      <!-- Search bar -->
      <div class="search-bar-container card">
        <div class="search-input-wrapper">
          <span class="search-icon">🔍</span>
          <input 
            type="text" 
            [(ngModel)]="searchQuery" 
            class="form-control" 
            placeholder="Search blogs..."
          />
        </div>
      </div>

      <!-- Blogs List/Table -->
      @if (loading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Loading blogs list...</p>
        </div>
      } @else if (filteredBlogs().length === 0) {
        <div class="empty-state">
          <div class="empty-state-icon">✍️</div>
          <p>No blog posts found.</p>
        </div>
      } @else {
        <div class="table-responsive">
          <table class="table">
            <thead>
              <tr>
                <th style="width: 80px;">Blog ID</th>
                <th style="width: 70px;">Image</th>
                <th>Blog Title</th>
                <th>Content Snippet</th>
                <th>Published Date</th>
                <th class="text-right" style="width: 180px;">Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (b of filteredBlogs(); track b.id) {
                <tr>
                  <td><strong>#{{ b.id }}</strong></td>
                  <td>
                    @if (b.image) {
                      <img [src]="b.image" alt="Blog image" class="blog-thumb" />
                    } @else {
                      <span class="no-img">—</span>
                    }
                  </td>
                  <td>
                    <span style="font-weight: 600;">{{ b.blogName }}</span>
                  </td>
                  <td>
                    <div class="content-snippet" [title]="b.blogContent">{{ b.blogContent }}</div>
                  </td>
                  <td>{{ b.createdAt | date:'mediumDate' }}</td>
                  <td class="text-right">
                    <div class="d-flex gap-2 justify-end">
                      <button (click)="openEditModal(b)" class="btn btn-outline btn-sm">✏️ Edit</button>
                      <button (click)="confirmDelete(b)" class="btn btn-danger btn-sm">🗑️ Delete</button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>

    <!-- Blog Write/Edit Modal -->
    @if (showModal()) {
      <div class="modal-backdrop">
        <div class="modal-container large">
          <div class="modal-title-bar">
            <h3>{{ isEditMode() ? '✏️ Edit Blog Post' : '➕ Write New Blog Post' }}</h3>
            <button (click)="closeModal()" class="modal-close">&times;</button>
          </div>
          <form (submit)="saveBlog($event)">
            <div class="modal-body">
              <div class="form-group">
                <label class="form-label">Blog Title *</label>
                <input 
                  type="text" 
                  [(ngModel)]="currentBlog.blogName" 
                  name="blogName"
                  class="form-control" 
                  placeholder="e.g. 5 Benefits of Daily Exercise"
                  required 
                />
              </div>

              <div class="form-group">
                <label class="form-label">Blog Content *</label>
                <textarea
                  [(ngModel)]="currentBlog.blogContent"
                  name="blogContent"
                  class="form-control"
                  rows="10"
                  placeholder="Write the full content of the post here..."
                  required
                ></textarea>
              </div>

              <div class="form-group">
                <label class="form-label">Cover Image URL</label>
                <input
                  type="url"
                  [(ngModel)]="currentBlog.image"
                  name="image"
                  class="form-control"
                  placeholder="https://example.com/image.jpg"
                />
                @if (currentBlog.image) {
                  <img [src]="currentBlog.image" alt="Preview" class="img-preview"
                    (error)="currentBlog.image = ''" />
                }
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" (click)="closeModal()" class="btn btn-outline" [disabled]="submitting()">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="submitting()">
                @if (submitting()) { Publishing... } @else { Publish Post }
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
    .content-snippet {
      max-width: 300px;
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
    .justify-end {
      justify-content: flex-end;
    }
    .blog-thumb {
      width: 48px;
      height: 48px;
      object-fit: cover;
      border-radius: 6px;
      border: 1px solid var(--border-color);
    }
    .no-img {
      color: var(--text-muted);
      font-size: 18px;
    }
    .img-preview {
      display: block;
      margin-top: 8px;
      width: 100%;
      max-height: 180px;
      object-fit: cover;
      border-radius: 8px;
      border: 1px solid var(--border-color);
    }
  `]
})
export class BlogsComponent implements OnInit {
  private readonly apiService = inject(AdminApiService);

  blogs = signal<any[]>([]);
  loading = signal(true);
  submitting = signal(false);
  searchQuery = '';

  // Modal State
  showModal = signal(false);
  isEditMode = signal(false);
  currentBlog: any = { blogName: '', blogContent: '', image: '' };

  // Toast
  toast = signal<{ message: string; type: 'success' | 'danger' | 'info' | 'warning' } | null>(null);

  ngOnInit(): void {
    this.loadBlogs();
  }

  showToast(message: string, type: 'success' | 'danger' | 'info' | 'warning' = 'info') {
    this.toast.set({ message, type });
    setTimeout(() => this.toast.set(null), 3000);
  }

  loadBlogs(): void {
    this.loading.set(true);
    this.apiService.getBlogs().subscribe({
      next: (res) => {
        this.blogs.set(res || []);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.showToast('Failed to load blogs list.', 'danger');
      }
    });
  }

  filteredBlogs() {
    const query = this.searchQuery.trim().toLowerCase();
    if (!query) return this.blogs();
    return this.blogs().filter(b => 
      b.blogName.toLowerCase().includes(query) || 
      b.blogContent.toLowerCase().includes(query)
    );
  }

  openAddModal(): void {
    this.isEditMode.set(false);
    this.currentBlog = { blogName: '', blogContent: '', image: '' };
    this.showModal.set(true);
  }

  openEditModal(blog: any): void {
    this.isEditMode.set(true);
    this.currentBlog = { ...blog };
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
  }

  saveBlog(event: Event): void {
    event.preventDefault();
    if (!this.currentBlog.blogName.trim() || !this.currentBlog.blogContent.trim()) {
      this.showToast('Title and content are required.', 'warning');
      return;
    }

    this.submitting.set(true);
    if (this.isEditMode()) {
      // Patch blog
      this.apiService.patchBlog(this.currentBlog.id, this.currentBlog).subscribe({
        next: () => {
          this.submitting.set(false);
          this.showModal.set(false);
          this.showToast('Blog updated successfully!', 'success');
          this.loadBlogs();
        },
        error: (err) => {
          this.submitting.set(false);
          this.showToast(err.error?.message || 'Failed to update blog.', 'danger');
        }
      });
    } else {
      // Create blog
      this.apiService.createBlog(this.currentBlog).subscribe({
        next: () => {
          this.submitting.set(false);
          this.showModal.set(false);
          this.showToast('Blog published successfully!', 'success');
          this.loadBlogs();
        },
        error: (err) => {
          this.submitting.set(false);
          this.showToast(err.error?.message || 'Failed to create blog.', 'danger');
        }
      });
    }
  }

  confirmDelete(blog: any): void {
    if (confirm(`Are you sure you want to delete the blog post "${blog.blogName}"?`)) {
      this.apiService.deleteBlog(blog.id).subscribe({
        next: () => {
          this.showToast('Blog post deleted successfully.', 'success');
          this.loadBlogs();
        },
        error: (err) => {
          this.showToast(err.error?.message || 'Failed to delete blog post.', 'danger');
        }
      });
    }
  }
}
