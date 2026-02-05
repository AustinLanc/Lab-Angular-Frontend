import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  username = '';
  password = '';
  error = signal<string | null>(null);
  loading = signal(false);

  private returnUrl: string = '/';

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    // If already authenticated, redirect
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/']);
    }

    // Get return URL from route parameters
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
  }

  onSubmit() {
    if (!this.username || !this.password) {
      this.error.set('Please enter both username and password');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.authService.login(this.username, this.password).subscribe({
      next: (response) => {
        this.loading.set(false);
        if (response.success) {
          this.router.navigateByUrl(this.returnUrl);
        }
      },
      error: (err) => {
        this.loading.set(false);
        if (err.status === 401) {
          this.error.set('Invalid username or password');
        } else {
          this.error.set('Login failed. Please try again.');
        }
        console.error('Login error:', err);
      }
    });
  }
}
