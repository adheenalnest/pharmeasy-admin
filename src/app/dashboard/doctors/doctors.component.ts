import { Component, inject, OnInit, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminApiService } from '../../services/admin-api.service';

@Component({
  selector: 'app-doctors',
  standalone: true,
  imports: [DecimalPipe, FormsModule],
  template: `
    <div class="doctors-container">
      <div class="d-flex justify-between align-center mb-4">
        <h1>🩺 Doctors Directory</h1>
        <button (click)="openAddModal()" class="btn btn-primary">➕ Add Doctor Profile</button>
      </div>

      <!-- Search bar -->
      <div class="search-bar-container card">
        <div class="search-input-wrapper">
          <span class="search-icon">🔍</span>
          <input 
            type="text" 
            [(ngModel)]="searchQuery" 
            class="form-control" 
            placeholder="Search by doctor name or specialisation..."
          />
        </div>
      </div>

      <!-- Doctors Table -->
      @if (loading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Loading doctors profiles...</p>
        </div>
      } @else if (filteredDoctors().length === 0) {
        <div class="empty-state">
          <div class="empty-state-icon">🩺</div>
          <p>No doctor profiles found.</p>
        </div>
      } @else {
        <div class="table-responsive">
          <table class="table">
            <thead>
              <tr>
                <th style="width:48px">#</th>
                <th>Doctor</th>
                <th>Specialisation</th>
                <th>Qualification</th>
                <th style="white-space:nowrap">Exp · Fee</th>
                <th style="width:90px">Status</th>
                <th style="width:130px" class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (d of filteredDoctors(); track d.id) {
                <tr>
                  <td class="text-muted" style="font-size:0.75rem;font-weight:600">#{{ d.id }}</td>
                  <td>
                    <div class="d-flex align-center gap-2">
                      @if (d.image && !d._imgError) {
                        <img [src]="d.image" alt="Profile" class="doctor-img" (error)="onImgError($event, d)" />
                      } @else {
                        <div class="doctor-avatar-placeholder">🩺</div>
                      }
                      <div>
                        <div class="doctor-name">{{ d.name || '—' }}</div>
                        <div class="doctor-sub">{{ d.email }}</div>
                        @if (d.phone) {
                          <div class="doctor-sub">{{ d.phone }}</div>
                        }
                      </div>
                    </div>
                  </td>
                  <td><span class="badge badge-info">{{ d.specialisation }}</span></td>
                  <td style="font-size:0.85rem">{{ d.qualification }}</td>
                  <td style="white-space:nowrap;font-size:0.85rem">
                    {{ d.experience }}y &nbsp;·&nbsp; <strong>₹{{ d.consultationFee | number:'1.0-0' }}</strong>
                  </td>
                  <td>
                    @if (d.isActive) {
                      <span class="badge badge-success">Active</span>
                    } @else {
                      <span class="badge badge-danger">Inactive</span>
                    }
                  </td>
                  <td class="text-right">
                    <div class="action-btns">
                      <button (click)="openScheduleModal(d)" class="icon-btn" title="Schedule">📅</button>
                      <button (click)="openEditModal(d)" class="icon-btn" title="Edit">✏️</button>
                      <button (click)="confirmDelete(d)" class="icon-btn danger" title="Delete">🗑️</button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>

    <!-- Doctor Profile Modal -->
    @if (showModal()) {
      <div class="modal-backdrop">
        <div class="modal-container large">
          <div class="modal-title-bar">
            <h3>{{ isEditMode() ? '✏️ Edit Doctor Profile' : '➕ Add Doctor Profile' }}</h3>
            <button (click)="closeModal()" class="modal-close">&times;</button>
          </div>
          <form (submit)="saveDoctor($event)">
            <div class="modal-body">
              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label">Doctor Name *</label>
                  <input type="text" [(ngModel)]="currentDoctor.name" name="name" class="form-control" required />
                </div>
                <div class="form-group">
                  <label class="form-label">Email Address *</label>
                  <input type="email" [(ngModel)]="currentDoctor.email" name="email" class="form-control" required [disabled]="isEditMode()" />
                </div>
              </div>

              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label">Phone Number</label>
                  <input type="text" [(ngModel)]="currentDoctor.phone" name="phone" class="form-control" />
                </div>
                <div class="form-group">
                  <label class="form-label">Profile Photo</label>
                  <div class="img-picker-row">
                    @if (currentDoctor.image) {
                      <img [src]="currentDoctor.image" class="img-preview" (error)="clearImagePreview()" alt="Preview" />
                    } @else {
                      <div class="img-preview-placeholder">🩺</div>
                    }
                    <div class="img-picker-actions">
                      <label class="btn btn-outline btn-sm" style="cursor:pointer;margin-bottom:0.4rem">
                        📁 Choose File
                        <input type="file" accept="image/*" (change)="onImageFileChange($event)" style="display:none" />
                      </label>
                      <input type="text" [(ngModel)]="currentDoctor.image" name="image" class="form-control" placeholder="or paste image URL..." style="font-size:0.75rem" />
                    </div>
                  </div>
                </div>
              </div>

              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label">Qualification *</label>
                  <input type="text" [(ngModel)]="currentDoctor.qualification" name="qualification" class="form-control" placeholder="e.g. MBBS, MD" required />
                </div>
                <div class="form-group">
                  <label class="form-label">Specialisation *</label>
                  <input type="text" [(ngModel)]="currentDoctor.specialisation" name="specialisation" class="form-control" placeholder="e.g. Cardiologist" required />
                </div>
              </div>

              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label">Experience (Years) *</label>
                  <input type="number" [(ngModel)]="currentDoctor.experience" name="experience" class="form-control" required min="0" />
                </div>
                <div class="form-group">
                  <label class="form-label">Consultation Fee (₹) *</label>
                  <input type="number" [(ngModel)]="currentDoctor.consultationFee" name="consultationFee" class="form-control" required min="0" step="0.01" />
                </div>
              </div>

              @if (isEditMode()) {
                <div class="form-group">
                  <label class="form-label">Account Status</label>
                  <div class="checkbox-wrapper">
                    <input type="checkbox" [(ngModel)]="currentDoctor.isActive" name="isActive" id="isActiveCheck" />
                    <label for="isActiveCheck">Toggle profile active (visible to patients)</label>
                  </div>
                </div>
              }
            </div>
            <div class="modal-footer">
              <button type="button" (click)="closeModal()" class="btn btn-outline" [disabled]="submitting()">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="submitting()">
                @if (submitting()) { Saving... } @else { Save Profile }
              </button>
            </div>
          </form>
        </div>
      </div>
    }

    <!-- Schedule / Unavailabilities Modal -->
    @if (showScheduleModal() && selectedDoctorForSchedule()) {
      <div class="modal-backdrop">
        <div class="modal-container large">
          <div class="modal-title-bar">
            <h3>📅 Schedule Block: Dr. {{ selectedDoctorForSchedule()?.name }}</h3>
            <button (click)="closeScheduleModal()" class="modal-close">&times;</button>
          </div>
          <div class="modal-body">
            <!-- New Schedule block form -->
            <div class="card" style="background-color: var(--bg-app); border-color: #cbd5e1; margin-bottom: 1.5rem;">
              <h4 style="margin-bottom: 0.75rem;">Block New Time Slot</h4>
              <form (submit)="addUnavailability($event)" class="form-grid" style="align-items: flex-end;">
                <div class="form-group" style="margin-bottom: 0;">
                  <label class="form-label">Weekday</label>
                  <select [(ngModel)]="newSlot.weekday" name="weekday" class="form-control" required>
                    <option [value]="0">Monday</option>
                    <option [value]="1">Tuesday</option>
                    <option [value]="2">Wednesday</option>
                    <option [value]="3">Thursday</option>
                    <option [value]="4">Friday</option>
                    <option [value]="5">Saturday</option>
                    <option [value]="6">Sunday</option>
                  </select>
                </div>

                <div class="form-group" style="margin-bottom: 0;">
                  <label class="form-label">Start Time</label>
                  <input type="time" [(ngModel)]="newSlot.startTime" name="startTime" class="form-control" required />
                </div>

                <div class="form-group" style="margin-bottom: 0;">
                  <label class="form-label">End Time</label>
                  <input type="time" [(ngModel)]="newSlot.endTime" name="endTime" class="form-control" required />
                </div>

                <div>
                  <button type="submit" class="btn btn-primary" [disabled]="savingSchedule()">Add Block</button>
                </div>
              </form>
            </div>

            <!-- Blocked Schedules list -->
            <h4>Currently Blocked Hours</h4>
            @if (loadingSchedule()) {
              <p class="text-muted mt-2 text-center">Loading schedules...</p>
            } @else if (unavailabilities().length === 0) {
              <p class="text-muted mt-2 text-center">Dr. {{ selectedDoctorForSchedule()?.name }} is fully available on all days.</p>
            } @else {
              <div class="table-responsive mt-2">
                <table class="table">
                  <thead>
                    <tr>
                      <th>Weekday</th>
                      <th>Time Block</th>
                      <th class="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (slot of unavailabilities(); track slot.id) {
                      <tr>
                        <td><strong>{{ slot.weekday }}</strong></td>
                        <td><span class="badge badge-danger">{{ slot.time }}</span></td>
                        <td class="text-right">
                          <button (click)="deleteUnavailability(slot.id)" class="btn btn-danger btn-sm">🗑️ Remove</button>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          </div>
          <div class="modal-footer">
            <button (click)="closeScheduleModal()" class="btn btn-primary">Close Schedule</button>
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
    .doctor-img {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      object-fit: cover;
      border: 2px solid var(--primary-light);
      flex-shrink: 0;
    }
    .doctor-avatar-placeholder {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: var(--primary-light);
      color: var(--primary);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.1rem;
      flex-shrink: 0;
    }
    .doctor-name {
      font-weight: 600;
      font-size: 0.875rem;
      white-space: nowrap;
    }
    .doctor-sub {
      font-size: 0.72rem;
      color: var(--text-muted);
      white-space: nowrap;
    }
    .action-btns {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 4px;
    }
    .icon-btn {
      background: transparent;
      border: 1px solid var(--border-color);
      border-radius: 6px;
      width: 32px;
      height: 32px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 0.9rem;
      transition: background 0.15s;
    }
    .icon-btn:hover { background: #f1f5f9; }
    .icon-btn.danger { border-color: #fecaca; }
    .icon-btn.danger:hover { background: #fef2f2; }
    .img-picker-row {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
    }
    .img-preview {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      object-fit: cover;
      border: 2px solid var(--primary-light);
      flex-shrink: 0;
    }
    .img-preview-placeholder {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: var(--primary-light);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      flex-shrink: 0;
      border: 2px dashed var(--border-color);
    }
    .img-picker-actions {
      display: flex;
      flex-direction: column;
      flex: 1;
      gap: 0.25rem;
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
  `]
})
export class DoctorsComponent implements OnInit {
  private readonly apiService = inject(AdminApiService);

  doctors = signal<any[]>([]);
  loading = signal(true);
  submitting = signal(false);
  searchQuery = '';

  // Doctor Form Modal control
  showModal = signal(false);
  isEditMode = signal(false);
  currentDoctor: any = {};

  // Schedule Modal control
  showScheduleModal = signal(false);
  selectedDoctorForSchedule = signal<any | null>(null);
  unavailabilities = signal<any[]>([]);
  loadingSchedule = signal(false);
  savingSchedule = signal(false);
  newSlot = { weekday: 0, startTime: '09:00', endTime: '17:00' };

  // Toast
  toast = signal<{ message: string; type: 'success' | 'danger' | 'info' | 'warning' } | null>(null);

  ngOnInit(): void {
    this.loadDoctors();
  }

  showToast(message: string, type: 'success' | 'danger' | 'info' | 'warning' = 'info') {
    this.toast.set({ message, type });
    setTimeout(() => this.toast.set(null), 3000);
  }

  loadDoctors(): void {
    this.loading.set(true);
    this.apiService.getDoctors().subscribe({
      next: (res) => {
        this.doctors.set(res || []);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.showToast('Failed to load doctors list.', 'danger');
      }
    });
  }

  filteredDoctors() {
    const query = this.searchQuery.trim().toLowerCase();
    if (!query) return this.doctors();
    return this.doctors().filter(d => 
      (d.name && d.name.toLowerCase().includes(query)) ||
      (d.specialisation && d.specialisation.toLowerCase().includes(query))
    );
  }

  onImgError(event: any, doctor: any): void {
    doctor._imgError = true;
  }

  onImageFileChange(event: any): void {
    const file: File = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      this.currentDoctor.image = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  clearImagePreview(): void {
    this.currentDoctor.image = '';
  }

  openAddModal(): void {
    this.isEditMode.set(false);
    this.currentDoctor = {
      name: '',
      email: '',
      phone: '',
      image: '',
      qualification: '',
      specialisation: '',
      experience: 1,
      consultationFee: 500
    };
    this.showModal.set(true);
  }

  openEditModal(doctor: any): void {
    this.isEditMode.set(true);
    // Bind email from related user object if direct email is empty
    const email = doctor.email || (doctor.user ? doctor.user.email : '');
    this.currentDoctor = { ...doctor, email };
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
  }

  saveDoctor(event: Event): void {
    event.preventDefault();
    if (!this.currentDoctor.name || !this.currentDoctor.email || !this.currentDoctor.qualification || !this.currentDoctor.specialisation) {
      this.showToast('Please fill in all required fields.', 'warning');
      return;
    }

    this.submitting.set(true);
    this.currentDoctor.experience = Number(this.currentDoctor.experience);
    this.currentDoctor.consultationFee = Number(this.currentDoctor.consultationFee);

    if (this.isEditMode()) {
      // Patch profile
      const patchData = {
        name: this.currentDoctor.name,
        phone: this.currentDoctor.phone,
        image: this.currentDoctor.image,
        qualification: this.currentDoctor.qualification,
        specialisation: this.currentDoctor.specialisation,
        experience: this.currentDoctor.experience,
        consultationFee: this.currentDoctor.consultationFee,
        isActive: !!this.currentDoctor.isActive
      };
      this.apiService.patchDoctor(this.currentDoctor.id, patchData).subscribe({
        next: () => {
          this.submitting.set(false);
          this.showModal.set(false);
          this.showToast('Doctor profile updated successfully!', 'success');
          this.loadDoctors();
        },
        error: (err) => {
          this.submitting.set(false);
          this.showToast(err.error?.message || 'Failed to update doctor profile.', 'danger');
        }
      });
    } else {
      // Create profile
      this.apiService.createDoctor(this.currentDoctor).subscribe({
        next: () => {
          this.submitting.set(false);
          this.showModal.set(false);
          this.showToast('Doctor profile created successfully!', 'success');
          this.loadDoctors();
        },
        error: (err) => {
          this.submitting.set(false);
          this.showToast(err.error?.message || 'Failed to create doctor profile.', 'danger');
        }
      });
    }
  }

  confirmDelete(doctor: any): void {
    if (confirm(`Are you sure you want to delete doctor profile "${doctor.name}"?`)) {
      this.apiService.deleteDoctor(doctor.id).subscribe({
        next: () => {
          this.showToast('Doctor profile deleted successfully.', 'success');
          this.loadDoctors();
        },
        error: (err) => {
          this.showToast(err.error?.message || 'Failed to delete doctor profile.', 'danger');
        }
      });
    }
  }

  // --- Doctor Unavailabilities Management ---
  openScheduleModal(doctor: any): void {
    this.selectedDoctorForSchedule.set(doctor);
    this.newSlot = { weekday: 0, startTime: '09:00', endTime: '17:00' };
    this.loadDoctorSchedule(doctor.id);
    this.showScheduleModal.set(true);
  }

  closeScheduleModal(): void {
    this.showScheduleModal.set(false);
    this.selectedDoctorForSchedule.set(null);
    this.unavailabilities.set([]);
  }

  loadDoctorSchedule(doctorProfileId: number): void {
    this.loadingSchedule.set(true);
    this.apiService.getDoctorUnavailabilities(doctorProfileId).subscribe({
      next: (res: any) => {
        this.unavailabilities.set(res.data || []);
        this.loadingSchedule.set(false);
      },
      error: () => {
        this.loadingSchedule.set(false);
        this.showToast('Failed to load doctor unavailabilities.', 'danger');
      }
    });
  }

  addUnavailability(event: Event): void {
    event.preventDefault();
    const doc = this.selectedDoctorForSchedule();
    if (!doc) return;

    this.savingSchedule.set(true);
    const timeRange = `${this.newSlot.startTime}-${this.newSlot.endTime}`;
    const payload = {
      weekday: Number(this.newSlot.weekday),
      time: timeRange,
      doctorProfileId: doc.id
    };

    this.apiService.createDoctorUnavailability(payload).subscribe({
      next: () => {
        this.savingSchedule.set(false);
        this.showToast('Schedule block added successfully!', 'success');
        this.loadDoctorSchedule(doc.id);
      },
      error: (err) => {
        this.savingSchedule.set(false);
        this.showToast(err.error?.message || 'Failed to add schedule block. Check time range.', 'danger');
      }
    });
  }

  deleteUnavailability(id: number): void {
    if (confirm('Are you sure you want to remove this schedule block?')) {
      const doc = this.selectedDoctorForSchedule();
      if (!doc) return;

      this.apiService.deleteDoctorUnavailability(id).subscribe({
        next: () => {
          this.showToast('Schedule block removed.', 'success');
          this.loadDoctorSchedule(doc.id);
        },
        error: (err) => {
          this.showToast(err.error?.message || 'Failed to remove schedule block.', 'danger');
        }
      });
    }
  }
}
