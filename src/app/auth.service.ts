import { Injectable, signal, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, of } from 'rxjs';

export interface User {
  username: string;
  displayName?: string;
  email?: string;
}

export interface LoginResponse {
  success: boolean;
  token: string;
  user: User;
}

export interface AuthCheckResponse {
  authenticated: boolean;
  user?: User;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private baseUrl = '/api/auth';
  private platformId = inject(PLATFORM_ID);

  isAuthenticated = signal(false);
  currentUser = signal<User | null>(null);
  isLoading = signal(true);

  constructor(private http: HttpClient, private router: Router) {
    // Only check auth status in browser, not during SSR
    if (isPlatformBrowser(this.platformId)) {
      this.checkAuthStatus();
    } else {
      // On server, immediately set loading to false
      this.isLoading.set(false);
    }
  }

  checkAuthStatus(): void {
    this.isLoading.set(true);

    this.http.get<AuthCheckResponse>(`${this.baseUrl}/me`, { withCredentials: true })
      .pipe(
        catchError(() => of({ authenticated: false } as AuthCheckResponse))
      )
      .subscribe(response => {
        this.isAuthenticated.set(response.authenticated);
        if (response.authenticated && response.user) {
          this.currentUser.set(response.user);
        } else {
          this.currentUser.set(null);
        }
        this.isLoading.set(false);
      });
  }

  login(username: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.baseUrl}/login`, { username, password }, { withCredentials: true })
      .pipe(
        tap(response => {
          if (response.success) {
            this.isAuthenticated.set(true);
            this.currentUser.set(response.user);
            // Store token in localStorage as backup (cookie is primary)
            localStorage.setItem('auth_token', response.token);
          }
        })
      );
  }

  logout(): Observable<any> {
    return this.http.post(`${this.baseUrl}/logout`, {}, { withCredentials: true })
      .pipe(
        tap(() => {
          this.isAuthenticated.set(false);
          this.currentUser.set(null);
          localStorage.removeItem('auth_token');
          this.router.navigate(['/login']);
        })
      );
  }

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }
}
