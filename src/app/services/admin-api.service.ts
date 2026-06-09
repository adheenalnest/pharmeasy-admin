import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AdminApiService {
  private readonly http = inject(HttpClient) as HttpClient;
  private readonly baseUrl = 'http://localhost:5074';
  private readonly tokenKey = 'pharm_admin_token';

  // --- Token Management ---
  setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  clearToken(): void {
    localStorage.removeItem(this.tokenKey);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  private getHeaders(): HttpHeaders {
    const token = this.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    });
  }

  // --- Auth APIs ---
  sendOtp(email: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/auth/send-otp`, { email });
  }

  verifyOtpAdmin(email: string, otp: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/auth/verify-otp/admin`, { email, otp });
  }

  // --- Products APIs ---
  getProducts(page: number = 1, limit: number = 20): Observable<any> {
    return this.http.get(`${this.baseUrl}/products?page=${page}&limit=${limit}`);
  }

  getProductById(id: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/products/${id}`);
  }

  createProduct(product: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/products`, product, { headers: this.getHeaders() });
  }

  updateProduct(id: number, product: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/products/${id}`, product, { headers: this.getHeaders() });
  }

  patchProduct(id: number, product: any): Observable<any> {
    return this.http.patch(`${this.baseUrl}/products/${id}`, product, { headers: this.getHeaders() });
  }

  deleteProduct(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/products/${id}`, { headers: this.getHeaders() });
  }

  // --- Categories APIs ---
  getCategories(): Observable<any[]> {
    return this.http.get<any>(`${this.baseUrl}/categories`).pipe(
      map(res => res?.data ?? res)
    );
  }

  getCategoryById(id: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/categories/${id}`);
  }

  createCategory(category: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/categories`, category, { headers: this.getHeaders() });
  }

  updateCategory(id: number, category: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/categories/${id}`, category, { headers: this.getHeaders() });
  }

  deleteCategory(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/categories/${id}`, { headers: this.getHeaders() });
  }

  // --- Blogs APIs ---
  getBlogs(): Observable<any[]> {
    return this.http.get<any>(`${this.baseUrl}/blogs`).pipe(
      map(res => res?.data ?? res)
    );
  }

  getBlogById(id: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/blogs/${id}`);
  }

  createBlog(blog: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/blogs`, blog, { headers: this.getHeaders() });
  }

  patchBlog(id: number, blog: any): Observable<any> {
    return this.http.patch(`${this.baseUrl}/blogs/${id}`, blog, { headers: this.getHeaders() });
  }

  deleteBlog(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/blogs/${id}`, { headers: this.getHeaders() });
  }

  // --- Coupons APIs ---
  getCoupons(): Observable<any[]> {
    return this.http.get<any>(`${this.baseUrl}/coupons`).pipe(
      map(res => res?.data ?? res)
    );
  }

  getCouponById(id: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/coupons/${id}`);
  }

  createCoupon(coupon: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/coupons`, coupon, { headers: this.getHeaders() });
  }

  patchCoupon(id: number, coupon: any): Observable<any> {
    return this.http.patch(`${this.baseUrl}/coupons/${id}`, coupon, { headers: this.getHeaders() });
  }

  deleteCoupon(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/coupons/${id}`, { headers: this.getHeaders() });
  }

  // --- Orders APIs ---
  getOrders(page: number = 1, limit: number = 20): Observable<any> {
    return this.http.get(`${this.baseUrl}/orders/admin?page=${page}&limit=${limit}`, { headers: this.getHeaders() });
  }

  getOrderById(id: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/orders/admin/${id}`, { headers: this.getHeaders() });
  }

  deleteOrder(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/orders/${id}`, { headers: this.getHeaders() });
  }

  // --- Delivery Charges APIs ---
  getDeliveryCharges(): Observable<any[]> {
    return this.http.get<any>(`${this.baseUrl}/deliverycharges`).pipe(
      map(res => res?.data ?? res)
    );
  }

  createDeliveryCharge(charge: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/deliverycharges`, charge, { headers: this.getHeaders() });
  }

  patchDeliveryCharge(id: number, charge: any): Observable<any> {
    return this.http.patch(`${this.baseUrl}/deliverycharges/${id}`, charge, { headers: this.getHeaders() });
  }

  deleteDeliveryCharge(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/deliverycharges/${id}`, { headers: this.getHeaders() });
  }

  // --- Doctors APIs ---
  getDoctors(): Observable<any[]> {
    return this.http.get<any>(`${this.baseUrl}/doctors`, { headers: this.getHeaders() }).pipe(
      map(res => (res?.data ?? res).map((d: any) => ({ ...d, id: d.doctorProfileId ?? d.id })))
    );
  }

  getDoctorById(id: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/doctors/${id}`, { headers: this.getHeaders() });
  }

  createDoctor(doctor: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/doctors`, doctor, { headers: this.getHeaders() });
  }

  patchDoctor(id: number, doctor: any): Observable<any> {
    return this.http.patch(`${this.baseUrl}/doctors/${id}`, doctor, { headers: this.getHeaders() });
  }

  deleteDoctor(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/doctors/${id}`, { headers: this.getHeaders() });
  }

  // --- Doctor Unavailabilities APIs ---
  getDoctorUnavailabilities(doctorProfileId: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/doctor-unavailabilities/admin/${doctorProfileId}`, { headers: this.getHeaders() });
  }

  createDoctorUnavailability(unavailability: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/doctor-unavailabilities/admin`, unavailability, { headers: this.getHeaders() });
  }

  deleteDoctorUnavailability(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/doctor-unavailabilities/${id}`, { headers: this.getHeaders() });
  }
}
