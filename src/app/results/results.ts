import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../api.service';
import { TestingData, ProductName } from '../models';

interface ColumnDef {
  key: string;
  label: string;
  field: keyof TestingData;
}

@Component({
  selector: 'app-results',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './results.html',
  styleUrl: './results.css',
})
export class Results implements OnInit {
  testingData = signal<TestingData[]>([]);
  products = signal<Map<string, string>>(new Map());
  loading = signal(true);
  error = signal<string | null>(null);

  searchTerm = signal('');

  // Column definitions for optional test columns
  optionalColumns: ColumnDef[] = [
    { key: 'pen0x', label: 'Unworked Pen', field: 'pen0x' },
    { key: 'pen10k', label: '10K Pen', field: 'pen10k' },
    { key: 'pen100k', label: '100K Pen', field: 'pen100k' },
    { key: 'weld', label: 'Weld', field: 'weld' },
    { key: 'wear', label: 'Wear', field: 'wear' },
    { key: 'timken', label: 'Timken', field: 'timken' },
    { key: 'rust', label: 'Rust', field: 'rust' },
    { key: 'copperCorrosion', label: 'Cu Corr', field: 'copperCorrosion' },
    { key: 'oxidation', label: 'Oxidation', field: 'oxidation' },
    { key: 'oilBleed', label: 'Oil Bleed', field: 'oilBleed' },
    { key: 'sprayOff', label: 'Spray Off', field: 'sprayOff' },
    { key: 'washout', label: 'Washout', field: 'washout' },
    { key: 'pressureBleed', label: 'Pres Bleed', field: 'pressureBleed' },
    { key: 'rollStabilityDry', label: 'Roll Stab (D)', field: 'rollStabilityDry' },
    { key: 'rollStabilityWet', label: 'Roll Stab (W)', field: 'rollStabilityWet' },
    { key: 'ftIr', label: 'FT-IR', field: 'ftIr' },
    { key: 'minitestMinus40', label: 'Mini -40', field: 'minitestMinus40' },
    { key: 'minitestMinus30', label: 'Mini -30', field: 'minitestMinus30' },
    { key: 'minitestMinus20', label: 'Mini -20', field: 'minitestMinus20' },
    { key: 'minitest0', label: 'Mini 0', field: 'minitest0' },
    { key: 'minitest20', label: 'Mini 20', field: 'minitest20' },
    { key: 'rheometer', label: 'Rheometer', field: 'rheometer' },
  ];

  // Track which optional columns are visible
  visibleColumns = signal<Set<string>>(new Set());

  filteredData = computed(() => {
    let data = this.testingData();
    const search = this.searchTerm().toLowerCase();

    if (search) {
      data = data.filter(item =>
        item.batch.toLowerCase().includes(search) ||
        item.code.toLowerCase().includes(search)
      );
    }

    return data;
  });

  constructor(private api: ApiService, private route: ActivatedRoute) {}

  ngOnInit() {
    // Check for search query param
    this.route.queryParams.subscribe(params => {
      if (params['search']) {
        this.searchTerm.set(params['search']);
      }
    });
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

    this.api.getTestingData().subscribe({
      next: (data) => {
        this.testingData.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load testing data');
        this.loading.set(false);
        console.error(err);
      }
    });
  }

  getProductName(code: string): string {
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

  displayValue(val: string | null | undefined): string {
    return val || '--';
  }

  isColumnVisible(key: string): boolean {
    return this.visibleColumns().has(key);
  }

  toggleColumn(key: string) {
    this.visibleColumns.update(cols => {
      const newCols = new Set(cols);
      if (newCols.has(key)) {
        newCols.delete(key);
      } else {
        newCols.add(key);
      }
      return newCols;
    });
  }

  selectAllColumns() {
    this.visibleColumns.set(new Set(this.optionalColumns.map(c => c.key)));
  }

  clearAllColumns() {
    this.visibleColumns.set(new Set());
  }

  getFieldValue(item: TestingData, field: keyof TestingData): string {
    const val = item[field];
    return val ? String(val) : '--';
  }
}
