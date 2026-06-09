import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminApiService } from '../services/admin-api.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="login-wrapper">
      <div class="login-card">
        <div class="brand-logo">
          <svg viewBox="0 0 120 130" width="80" height="80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="10" y="10" width="100" height="100" rx="20" fill="#10847e" />
            <path d="M60 35 V95 M30 65 H90" stroke="white" stroke-width="12" stroke-linecap="round" />
          </svg>
          <h1>PharmEasy Admin</h1>
          <p class="subtitle">Secure Portal Login</p>
        </div>

        @if (!otpSent()) {
          <form (submit)="requestOtp($event)" class="login-form">
            <div class="form-group">
              <label class="form-label">Email Address</label>
              <input 
                type="email" 
                name="email"
                [(ngModel)]="email" 
                class="form-control" 
                placeholder="Enter admin email (e.g. admin@pharmeasy.com)" 
                required 
                [disabled]="loading()"
              />
            </div>
            <button type="submit" class="btn btn-primary w-full mt-4" [disabled]="loading()">
              @if (loading()) {
                Sending OTP...
              } @else {
                Request OTP
              }
            </button>
          </form>
        } @else {
          <form (submit)="verifyOtp($event)" class="login-form">
            <div class="form-group">
              <label class="form-label">Verification Code (OTP)</label>
              <input 
                type="text" 
                name="otp"
                [(ngModel)]="otp" 
                class="form-control text-center" 
                placeholder="Enter 6-digit OTP" 
                maxlength="6"
                required 
                [disabled]="loading()"
              />
              <p class="resend-text">Sent to <strong>{{ email }}</strong></p>
            </div>
            <button type="submit" class="btn btn-primary w-full mt-4" [disabled]="loading()">
              @if (loading()) {
                Verifying...
              } @else {
                Verify & Log In
              }
            </button>
            <button type="button" (click)="otpSent.set(false)" class="btn btn-outline w-full mt-2" [disabled]="loading()">
              Back
            </button>
          </form>
        }
      </div>
    </div>

    <!-- Toast Notification Overlay -->
    @if (toast()) {
      <div class="toast-container">
        <div class="toast" [class]="'toast-' + toast()?.type">
          <span>{{ toast()?.message }}</span>
        </div>
      </div>
    }
  `,
  styles: [`
    .login-wrapper {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: radial-gradient(circle at 10% 20%, rgba(16, 132, 126, 0.1) 0%, rgba(244, 247, 246, 1) 90.1%);
      padding: 1.5rem;
    }
    .login-card {
      background: rgba(255, 255, 255, 0.85);
      backdrop-filter: blur(8px);
      border: 1px solid rgba(255, 255, 255, 0.5);
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow-xl);
      padding: 3rem 2.5rem;
      width: 100%;
      max-width: 440px;
      text-align: center;
    }
    .brand-logo {
      margin-bottom: 2rem;
    }
    .brand-logo svg {
      margin-bottom: 1rem;
      filter: drop-shadow(0 4px 6px rgba(16, 132, 126, 0.15));
    }
    .brand-logo h1 {
      font-size: 1.75rem;
      font-weight: 700;
      color: var(--primary);
    }
    .subtitle {
      color: var(--text-muted);
      font-size: 0.875rem;
      margin-top: 0.25rem;
    }
    .login-form {
      text-align: left;
    }
    .resend-text {
      font-size: 0.75rem;
      color: var(--text-muted);
      margin-top: 0.5rem;
      text-align: center;
    }
  `]
})
export class LoginComponent {
  private readonly apiService = inject(AdminApiService);
  private readonly router = inject(Router);

  email = '';
  otp = '';
  loading = signal(false);
  otpSent = signal(false);
  toast = signal<{ message: string; type: 'success' | 'danger' | 'info' | 'warning' } | null>(null);

  showToast(message: string, type: 'success' | 'danger' | 'info' | 'warning' = 'info') {
    this.toast.set({ message, type });
    setTimeout(() => this.toast.set(null), 3000);
  }

  requestOtp(event: Event): void {
    event.preventDefault();
    if (!this.email) return;

    this.loading.set(true);
    this.apiService.sendOtp(this.email).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.otpSent.set(true);
        this.showToast('OTP sent successfully to your email!', 'success');
      },
      error: (err) => {
        this.loading.set(false);
        this.showToast(err.error?.message || 'Failed to send OTP. Please check email.', 'danger');
      }
    });
  }

  verifyOtp(event: Event): void {
    event.preventDefault();
    if (!this.email || !this.otp) return;

    this.loading.set(true);
    this.apiService.verifyOtpAdmin(this.email, this.otp).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.user && res.user.role === 'Admin') {
          this.apiService.setToken(res.token);
          this.showToast('Login successful! Redirecting...', 'success');
          setTimeout(() => {
            this.router.navigate(['/dashboard']);
          }, 1000);
        } else {
          this.showToast('Access Denied. You must be an Admin user.', 'danger');
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.showToast(err.error?.message || 'Invalid verification code.', 'danger');
      }
    });
  }
}
