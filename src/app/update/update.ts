import { Component, OnInit, AfterViewInit, signal, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../api.service';
import { Retain, ProductName } from '../models';

interface RecentActivity {
  action: 'added' | 'removed';
  code: number;
  batch: string;
  box: number;
  time: Date;
}

@Component({
  selector: 'app-update',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './update.html',
  styleUrl: './update.css',
})
export class Update implements OnInit, AfterViewInit {
  @ViewChild('codeBatchInput') codeBatchInput!: ElementRef<HTMLInputElement>;

  retains = signal<Retain[]>([]);
  products = signal<Map<number, string>>(new Map());
  loading = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);

  recentActivity = signal<RecentActivity[]>([]);

  // Form fields
  productCodeBatch = '';
  boxNumber = '';
  releaseDate = '';

  stats = signal({
    totalRetains: 0,
    activeBoxes: 0,
    pendingReview: 0
  });

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.loadData();
    this.releaseDate = new Date().toISOString().split('T')[0];
  }

  ngAfterViewInit() {
    this.focusInput();
  }

  focusInput() {
    setTimeout(() => {
      this.codeBatchInput?.nativeElement?.focus();
    }, 0);
  }

  loadData() {
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
        const boxes = new Set(retains.map(r => r.box));
        this.stats.set({
          totalRetains: retains.length,
          activeBoxes: boxes.size,
          pendingReview: 0
        });
      },
      error: (err) => console.error('Failed to load retains', err)
    });
  }

  parseInput(): { code: number; batch: string } | null {
    const parts = this.productCodeBatch.trim().split(/\s+/);
    if (parts.length < 2) return null;
    const code = parseInt(parts[0], 10);
    const batch = parts[1];
    if (isNaN(code) || !batch) return null;
    return { code, batch };
  }

  addRetain() {
    const parsed = this.parseInput();
    if (!parsed) {
      this.error.set('Please enter a valid Product Code and Batch Number (e.g. "507450 NA5001")');
      return;
    }

    const box = parseInt(this.boxNumber, 10);
    if (isNaN(box)) {
      this.error.set('Please enter a valid box number');
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.success.set(null);

    const retain: Retain = {
      id: 0,
      code: parsed.code,
      batch: parsed.batch,
      box: box,
      date: this.releaseDate || new Date().toISOString().split('T')[0]
    };

    this.api.createRetain(retain).subscribe({
      next: (created) => {
        this.loading.set(false);
        this.success.set(`Retain added: ${parsed.batch} to Box ${box}`);
        this.recentActivity.update(activities => [{
          action: 'added',
          code: parsed.code,
          batch: parsed.batch,
          box: box,
          time: new Date()
        }, ...activities.slice(0, 9)]);
        this.clearForm();
        this.loadData();
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set('Failed to add retain');
        console.error(err);
      }
    });
  }

  removeRetain() {
    const parsed = this.parseInput();
    if (!parsed) {
      this.error.set('Please enter a valid Product Code and Batch Number (e.g. "507450 NA5001")');
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.success.set(null);

    // Find retain by batch
    this.api.getRetainsByBatch(parsed.batch).subscribe({
      next: (retains) => {
        if (retains.length === 0) {
          this.loading.set(false);
          this.error.set(`No retain found with batch ${parsed.batch}`);
          return;
        }

        const retain = retains[0];
        this.api.deleteRetain(retain.id).subscribe({
          next: () => {
            this.loading.set(false);
            this.success.set(`Retain removed: ${parsed.batch}`);
            this.recentActivity.update(activities => [{
              action: 'removed',
              code: parsed.code,
              batch: parsed.batch,
              box: retain.box,
              time: new Date()
            }, ...activities.slice(0, 9)]);
            this.clearForm();
            this.loadData();
          },
          error: (err) => {
            this.loading.set(false);
            this.error.set('Failed to remove retain');
            console.error(err);
          }
        });
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set('Failed to find retain');
        console.error(err);
      }
    });
  }

  clearForm() {
    this.productCodeBatch = '';
    this.boxNumber = '';
    this.releaseDate = new Date().toISOString().split('T')[0];
    this.focusInput();
  }

  formatTimeAgo(date: Date): string {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds} sec ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  }
}
