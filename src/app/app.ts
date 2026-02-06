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
import { FormsModule } from '@angular/forms';
import { filter, map, debounceTime, distinctUntilChanged, Subject, forkJoin, of } from 'rxjs';
import { interval, Subscription } from 'rxjs';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';

interface SearchSuggestion {
  batch: string;
  type: 'qc' | 'retains' | 'results';
  label: string;
  route: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterOutlet, RouterLink, RouterLinkActive],
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

  // Quick search
  searchQuery = '';
  searchSuggestions = signal<SearchSuggestion[]>([]);
  showSuggestions = signal(false);
  searchLoading = signal(false);
  private searchSubject = new Subject<string>();

  private refreshSubscription?: Subscription;
  private searchSubscription?: Subscription;

  // Computed property to check if we should show the main layout
  showLayout = computed(() => {
    return !this.isLoginPage();
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

    // Set up search debouncing
    this.searchSubscription = this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(query => {
      this.performSearch(query);
    });
  }

  ngOnDestroy() {
    this.refreshSubscription?.unsubscribe();
    this.searchSubscription?.unsubscribe();
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

  onSearchInput(event: Event) {
    const query = (event.target as HTMLInputElement).value.trim();
    this.searchQuery = query;
    if (query.length >= 2) {
      this.searchSubject.next(query);
      this.showSuggestions.set(true);
    } else {
      this.searchSuggestions.set([]);
      this.showSuggestions.set(false);
    }
  }

  performSearch(query: string) {
    if (!query || query.length < 2) {
      this.searchSuggestions.set([]);
      return;
    }

    this.searchLoading.set(true);

    forkJoin({
      qc: this.api.searchQcLogs(query).pipe(map(results => results.slice(0, 5))),
      retains: this.api.searchRetains(query).pipe(map(results => results.slice(0, 5))),
      results: this.api.searchTestingData(query).pipe(map(results => results.slice(0, 5)))
    }).subscribe({
      next: ({ qc, retains, results }) => {
        const suggestions: SearchSuggestion[] = [];
        const seenBatches = new Set<string>();

        // Add QC matches
        qc.forEach(item => {
          if (!seenBatches.has(item.batch + '-qc')) {
            seenBatches.add(item.batch + '-qc');
            suggestions.push({
              batch: item.batch,
              type: 'qc',
              label: `${item.batch} (QC Logs)`,
              route: '/qc'
            });
          }
        });

        // Add Retain matches
        retains.forEach(item => {
          if (!seenBatches.has(item.batch + '-retains')) {
            seenBatches.add(item.batch + '-retains');
            suggestions.push({
              batch: item.batch,
              type: 'retains',
              label: `${item.batch} (Retains)`,
              route: '/retains'
            });
          }
        });

        // Add Results matches
        results.forEach(item => {
          if (!seenBatches.has(item.batch + '-results')) {
            seenBatches.add(item.batch + '-results');
            suggestions.push({
              batch: item.batch,
              type: 'results',
              label: `${item.batch} (Results)`,
              route: '/results'
            });
          }
        });

        this.searchSuggestions.set(suggestions.slice(0, 10));
        this.searchLoading.set(false);
      },
      error: () => {
        this.searchLoading.set(false);
        this.searchSuggestions.set([]);
      }
    });
  }

  selectSuggestion(suggestion: SearchSuggestion) {
    this.router.navigate([suggestion.route], {
      queryParams: { search: suggestion.batch }
    });
    this.searchQuery = '';
    this.searchSuggestions.set([]);
    this.showSuggestions.set(false);
  }

  hideSuggestions() {
    // Delay to allow click events to fire
    setTimeout(() => {
      this.showSuggestions.set(false);
    }, 200);
  }
}
