import { Component, signal, OnInit, OnDestroy, computed } from '@angular/core';
import {
  Router,
  RouterOutlet,
  RouterLink,
  RouterLinkActive,
  NavigationEnd,
  ActivatedRoute,
} from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter, map } from 'rxjs/operators';
import { interval, Subscription } from 'rxjs';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit, OnDestroy {
  title = signal('');
  sidebarCollapsed = signal(false);
  remindersDueToday = signal(0);
  currentDate = signal(new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }));

  private refreshSubscription?: Subscription;

  // Computed property to check if we should show the main layout
  showLayout = computed(() => {
    return this.authService.isAuthenticated() && !this.isLoginPage();
  });

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private api: ApiService,
    public authService: AuthService
  ) {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        map(() => {
          let child = this.route.firstChild;
          while (child?.firstChild) {
            child = child.firstChild;
          }
          return child?.snapshot.data['title'] || '';
        })
      )
      .subscribe((title) => {
        this.title.set(title);
      });
  }

  ngOnInit() {
    this.loadReminderCount();
    // Refresh count every 5 minutes
    this.refreshSubscription = interval(5 * 60 * 1000).subscribe(() => {
      if (this.authService.isAuthenticated()) {
        this.loadReminderCount();
      }
    });
  }

  ngOnDestroy() {
    this.refreshSubscription?.unsubscribe();
  }

  isLoginPage(): boolean {
    return this.router.url === '/login';
  }

  loadReminderCount() {
    if (!this.authService.isAuthenticated()) {
      return;
    }

    this.api.getPendingReminders().subscribe({
      next: (reminders) => {
        const now = new Date();
        const tomorrow = new Date();
        tomorrow.setHours(0, 0, 0, 0);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Count reminders that are overdue or due today
        const dueTodayOrOverdue = reminders.filter(r => {
          const dueDate = new Date(r.due);
          return dueDate < tomorrow;
        }).length;

        this.remindersDueToday.set(dueTodayOrOverdue);
      },
      error: (err) => {
        console.error('Failed to load reminder count', err);
      }
    });
  }

  toggleSidebar() {
    this.sidebarCollapsed.set(!this.sidebarCollapsed());
  }

  logout() {
    this.authService.logout().subscribe();
  }

  getUserInitials(): string {
    const user = this.authService.currentUser();
    if (!user) return '??';

    const name = user.displayName || user.username;
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  getUserDisplayName(): string {
    const user = this.authService.currentUser();
    if (!user) return 'User';
    return user.displayName || user.username;
  }
}
