import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../api.service';
import { Reminder } from '../models';

@Component({
  selector: 'app-reminders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reminders.html',
  styleUrl: './reminders.css',
})
export class Reminders implements OnInit {
  reminders = signal<Reminder[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  // Form fields
  batchNumber = '';
  dayOffset: number | null = null;
  selectedDate: string = '';
  useDate = false;

  filteredReminders = computed(() => {
    const all = this.reminders();
    const now = new Date();

    return all.map(r => {
      const dueDate = new Date(r.due);
      let status: 'overdue' | 'due_today' | 'upcoming';

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const dueDateOnly = new Date(dueDate);
      dueDateOnly.setHours(0, 0, 0, 0);

      if (dueDateOnly < today) {
        status = 'overdue';
      } else if (dueDateOnly.getTime() === today.getTime()) {
        status = 'due_today';
      } else {
        status = 'upcoming';
      }

      return { ...r, status };
    }).sort((a, b) => new Date(a.due).getTime() - new Date(b.due).getTime());
  });

  stats = computed(() => {
    const all = this.filteredReminders();

    return {
      total: all.length,
      overdue: all.filter(r => r.status === 'overdue').length,
      dueToday: all.filter(r => r.status === 'due_today').length,
      upcoming: all.filter(r => r.status === 'upcoming').length
    };
  });

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading.set(true);
    this.error.set(null);

    this.api.getPendingReminders().subscribe({
      next: (reminders) => {
        this.reminders.set(reminders);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load reminders');
        this.loading.set(false);
        console.error(err);
      }
    });
  }

  addReminder() {
    if (!this.batchNumber) {
      return;
    }

    let offset = 0;

    if (this.useDate && this.selectedDate) {
      // Calculate offset from selected date
      const selected = new Date(this.selectedDate);
      selected.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      offset = Math.round((selected.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    } else if (this.dayOffset !== null) {
      offset = this.dayOffset;
    }

    this.api.createBatchReminders(this.batchNumber, offset).subscribe({
      next: (newReminders) => {
        this.loadData();
        this.batchNumber = '';
        this.dayOffset = null;
        this.selectedDate = '';
      },
      error: (err) => {
        this.error.set('Failed to add reminders');
        console.error(err);
      }
    });
  }

  toggleOffsetMode() {
    this.useDate = !this.useDate;
    this.dayOffset = null;
    this.selectedDate = '';
  }

  getTodayString(): string {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  markComplete(reminder: Reminder & { status: string }) {
    this.api.markReminderAsNotified(reminder.id).subscribe({
      next: () => {
        this.loadData();
      },
      error: (err) => {
        this.error.set('Failed to mark reminder as complete');
        console.error(err);
      }
    });
  }

  deleteReminder(reminder: Reminder & { status: string }) {
    this.api.deleteReminder(reminder.id).subscribe({
      next: () => {
        this.loadData();
      },
      error: (err) => {
        this.error.set('Failed to delete reminder');
        console.error(err);
      }
    });
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '--';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  formatDateTime(dateStr: string): string {
    if (!dateStr) return '--';
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }

  getDaysUntil(dateStr: string): string {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dateStr);
    due.setHours(0, 0, 0, 0);

    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`;
    if (diffDays === 0) return 'Due today';
    return `In ${diffDays} days`;
  }

  getIntervalLabel(interval: string): string {
    switch (interval) {
      case '48h': return '48 Hour Check';
      case '7d': return '7 Day Check';
      case '3m': return '3 Month Check';
      case '1y': return '1 Year Check';
      default: return interval;
    }
  }
}
