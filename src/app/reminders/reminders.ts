import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../api.service';
import { MonthlyBatch, ProductName } from '../models';

interface Reminder {
  batch: string;
  code: number;
  type: string;
  dueDate: Date;
  createdBy: string;
  status: 'overdue' | 'due_today' | 'upcoming';
}

@Component({
  selector: 'app-reminders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reminders.html',
  styleUrl: './reminders.css',
})
export class Reminders implements OnInit {
  batches = signal<MonthlyBatch[]>([]);
  products = signal<Map<number, string>>(new Map());
  loading = signal(true);
  error = signal<string | null>(null);

  // Local reminders (stored in memory for this session)
  reminders = signal<Reminder[]>([]);

  // Form fields
  batchNumber = '';
  reminderType = '';

  stats = computed(() => {
    const all = this.reminders();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

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

    this.api.getProducts().subscribe({
      next: (products) => {
        const productMap = new Map<number, string>();
        products.forEach(p => productMap.set(p.code, p.name));
        this.products.set(productMap);
      },
      error: (err) => console.error('Failed to load products', err)
    });

    this.api.getBatches().subscribe({
      next: (batches) => {
        this.batches.set(batches);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load batches');
        this.loading.set(false);
        console.error(err);
      }
    });
  }

  getProductName(code: number): string {
    return this.products().get(code) || 'Unknown Product';
  }

  addReminder() {
    if (!this.batchNumber || !this.reminderType) {
      return;
    }

    // Find the batch to get the code
    const batch = this.batches().find(b => b.batch === this.batchNumber);
    const code = batch?.code || 0;

    // Default due date is 7 days from now
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7);

    const reminder: Reminder = {
      batch: this.batchNumber,
      code: code,
      type: this.reminderType,
      dueDate: dueDate,
      createdBy: 'Current User',
      status: 'upcoming'
    };

    this.reminders.update(r => [reminder, ...r]);
    this.batchNumber = '';
    this.reminderType = '';
  }

  markComplete(reminder: Reminder) {
    this.reminders.update(r => r.filter(item => item !== reminder));
  }

  deleteReminder(reminder: Reminder) {
    this.reminders.update(r => r.filter(item => item !== reminder));
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  getDaysUntil(date: Date): string {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(date);
    due.setHours(0, 0, 0, 0);

    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`;
    if (diffDays === 0) return 'Due today';
    return `In ${diffDays} days`;
  }

  getInitials(name: string): string {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }
}
