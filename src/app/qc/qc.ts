import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../api.service';
import { QcLog, ProductName } from '../models';

@Component({
  selector: 'app-qc',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './qc.html',
  styleUrl: './qc.css',
})
export class Qc implements OnInit {
  qcLogs = signal<QcLog[]>([]);
  products = signal<Map<string, string>>(new Map());
  loading = signal(true);
  error = signal<string | null>(null);

  searchTerm = signal('');
  statusFilter = signal('all');
  releasedByFilter = signal('all');

  filteredLogs = computed(() => {
    let logs = this.qcLogs();
    const search = this.searchTerm().toLowerCase();
    const status = this.statusFilter();
    const releasedBy = this.releasedByFilter();

    if (search) {
      logs = logs.filter(log =>
        log.batch.toLowerCase().includes(search) ||
        log.code.toLowerCase().includes(search)
      );
    }

    if (releasedBy !== 'all') {
      logs = logs.filter(log => log.releasedBy === releasedBy);
    }

    // Sort by date descending (newest first)
    return [...logs].sort((a, b) => {
      const dateA = this.parseDate(a.date);
      const dateB = this.parseDate(b.date);
      if (!dateA && !dateB) return 0;
      if (!dateA) return 1;
      if (!dateB) return -1;
      return dateB.getTime() - dateA.getTime();
    });
  });

  releasedByOptions = computed(() => {
    const users = new Set(this.qcLogs().map(log => log.releasedBy).filter(Boolean));
    return Array.from(users);
  });

  stats = computed(() => {
    const logs = this.qcLogs();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const releasedToday = logs.filter(log => {
      if (!log.date) return false;
      const logDate = this.parseDate(log.date);
      if (!logDate) return false;
      logDate.setHours(0, 0, 0, 0);
      return logDate.getTime() === today.getTime();
    }).length;

    return {
      releasedToday,
      total: logs.length
    };
  });

  private parseDate(dateStr: string): Date | null {
    if (!dateStr) return null;

    // Handle date ranges - use the first date for sorting
    const rangeMatch = dateStr.match(/^(.+?)\s*-\s*(.+)$/);
    if (rangeMatch) {
      return this.parseSingleDate(rangeMatch[1].trim());
    }

    return this.parseSingleDate(dateStr);
  }

  private parseSingleDate(dateStr: string): Date | null {
    if (!dateStr) return null;

    let date = new Date(dateStr);

    if (isNaN(date.getTime())) {
      const patterns = [
        /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
        /^(\d{4})-(\d{1,2})-(\d{1,2})$/,
        /^(\d{1,2})-(\d{1,2})-(\d{4})$/,
      ];

      for (const pattern of patterns) {
        const match = dateStr.match(pattern);
        if (match) {
          if (pattern.source.startsWith('^(\\d{4})')) {
            date = new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]));
          } else {
            date = new Date(parseInt(match[3]), parseInt(match[1]) - 1, parseInt(match[2]));
          }
          break;
        }
      }
    }

    return isNaN(date.getTime()) ? null : date;
  }

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading.set(true);
    this.error.set(null);

    this.api.getProducts().subscribe({
      next: (products) => {
        const productMap = new Map<string, string>();
        products.forEach(p => productMap.set(p.code.toString(), p.name));
        this.products.set(productMap);
      },
      error: (err) => console.error('Failed to load products', err)
    });

    this.api.getQcLogs().subscribe({
      next: (logs) => {
        this.qcLogs.set(logs);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load QC logs');
        this.loading.set(false);
        console.error(err);
      }
    });
  }

  getProductName(code: string): string {
    return this.products().get(code) || 'Unknown Product';
  }

  getInitials(name: string): string {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '--';

    // Check for date range format: "m/d/yyyy - m/d/yyyy" or similar
    const rangeMatch = dateStr.match(/^(.+?)\s*-\s*(.+)$/);
    if (rangeMatch) {
      const startDate = this.formatSingleDate(rangeMatch[1].trim());
      const endDate = this.formatSingleDate(rangeMatch[2].trim());
      if (startDate !== '--' && endDate !== '--') {
        return `${startDate} - ${endDate}`;
      }
    }

    return this.formatSingleDate(dateStr);
  }

  private formatSingleDate(dateStr: string): string {
    if (!dateStr) return '--';

    let date = new Date(dateStr);

    // If invalid date, try to parse common formats
    if (isNaN(date.getTime())) {
      const patterns = [
        /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,  // M/D/YYYY
        /^(\d{4})-(\d{1,2})-(\d{1,2})$/,     // YYYY-M-D
        /^(\d{1,2})-(\d{1,2})-(\d{4})$/,     // M-D-YYYY
      ];

      for (const pattern of patterns) {
        const match = dateStr.match(pattern);
        if (match) {
          if (pattern.source.startsWith('^(\\d{4})')) {
            // YYYY-M-D format
            date = new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]));
          } else {
            // M/D/YYYY or M-D-YYYY format
            date = new Date(parseInt(match[3]), parseInt(match[1]) - 1, parseInt(match[2]));
          }
          break;
        }
      }

      // If still invalid, return the raw string
      if (isNaN(date.getTime())) {
        return dateStr;
      }
    }

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  onSearch(event: Event) {
    const input = event.target as HTMLInputElement;
    this.searchTerm.set(input.value);
  }

  onStatusFilter(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.statusFilter.set(select.value);
  }

  onReleasedByFilter(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.releasedByFilter.set(select.value);
  }
}
