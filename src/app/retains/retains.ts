import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../api.service';
import { Retain, ProductName } from '../models';

@Component({
  selector: 'app-retains',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './retains.html',
  styleUrl: './retains.css',
})
export class Retains implements OnInit {
  retains = signal<Retain[]>([]);
  products = signal<Map<number, string>>(new Map());
  loading = signal(true);
  error = signal<string | null>(null);

  searchTerm = signal('');
  boxFilter = signal<number | null>(null);

  filteredRetains = computed(() => {
    let data = this.retains();
    const search = this.searchTerm().toLowerCase();
    const box = this.boxFilter();

    if (search) {
      data = data.filter(r =>
        r.batch.toLowerCase().includes(search) ||
        r.code.toString().includes(search)
      );
    }

    if (box !== null) {
      data = data.filter(r => r.box === box);
    }

    // Sort by box number
    return [...data].sort((a, b) => a.box - b.box);
  });

  boxOptions = computed(() => {
    const boxes = new Set(this.retains().map(r => r.box));
    return Array.from(boxes).sort((a, b) => a - b);
  });

  stats = computed(() => {
    const data = this.retains();
    return {
      total: data.length,
      active: data.length,
      expiring: 0,
      expired: 0
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

    this.api.getRetains().subscribe({
      next: (retains) => {
        this.retains.set(retains);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load retains');
        this.loading.set(false);
        console.error(err);
      }
    });
  }

  getProductName(code: number): string {
    return this.products().get(code) || 'Unknown Product';
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

  onSearch(event: Event) {
    const input = event.target as HTMLInputElement;
    this.searchTerm.set(input.value);
  }

  onBoxFilter(event: Event) {
    const select = event.target as HTMLSelectElement;
    const value = select.value;
    this.boxFilter.set(value === 'all' ? null : parseInt(value, 10));
  }

  deleteRetain(retain: Retain) {
    if (!confirm(`Are you sure you want to delete retain ${retain.batch}?`)) {
      return;
    }

    this.api.deleteRetain(retain.id).subscribe({
      next: () => {
        this.loadData();
      },
      error: (err) => {
        this.error.set('Failed to delete retain');
        console.error(err);
      }
    });
  }
}
