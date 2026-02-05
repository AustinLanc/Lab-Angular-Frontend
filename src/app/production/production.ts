import { Component, OnInit, signal, ElementRef, ViewChild, AfterViewInit, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../api.service';
import { MonthlyStats } from '../models';
import { Chart, ChartConfiguration, registerables } from 'chart.js';

@Component({
  selector: 'app-production',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './production.html',
  styleUrl: './production.css',
})
export class Production implements OnInit, AfterViewInit {
  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;

  private platformId = inject(PLATFORM_ID);
  private chart: Chart | null = null;

  availableYears = signal<number[]>([]);
  selectedYear = signal<number>(new Date().getFullYear());
  monthlyStats = signal<MonthlyStats[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  // Computed totals
  totalReleased = signal(0);
  totalRework = signal(0);

  constructor(private api: ApiService) {
    if (isPlatformBrowser(this.platformId)) {
      Chart.register(...registerables);
    }
  }

  ngOnInit() {
    this.loadAvailableYears();
  }

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.loadStats();
    }
  }

  loadAvailableYears() {
    this.api.getAvailableYears().subscribe({
      next: (years) => {
        this.availableYears.set(years);
        if (years.length > 0 && !years.includes(this.selectedYear())) {
          this.selectedYear.set(years[0]);
        }
      },
      error: (err) => {
        console.error('Failed to load available years', err);
      }
    });
  }

  loadStats() {
    this.loading.set(true);
    this.error.set(null);

    this.api.getMonthlyStats(this.selectedYear()).subscribe({
      next: (stats) => {
        this.monthlyStats.set(stats);
        this.calculateTotals(stats);
        this.loading.set(false);
        if (isPlatformBrowser(this.platformId)) {
          setTimeout(() => this.renderChart(), 0);
        }
      },
      error: (err) => {
        this.error.set('Failed to load production stats');
        this.loading.set(false);
        console.error(err);
      }
    });
  }

  calculateTotals(stats: MonthlyStats[]) {
    const released = stats.reduce((sum, s) => sum + s.totalPounds, 0);
    const rework = stats.reduce((sum, s) => sum + s.reworkPounds, 0);
    this.totalReleased.set(released);
    this.totalRework.set(rework);
  }

  onYearChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.selectedYear.set(parseInt(select.value, 10));
    this.loadStats();
  }

  renderChart() {
    if (!this.chartCanvas?.nativeElement) return;

    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    // Destroy existing chart
    if (this.chart) {
      this.chart.destroy();
    }

    const stats = this.monthlyStats();
    const labels = stats.map(s => s.monthName);
    const releasedData = stats.map(s => s.totalPounds);
    const reworkData = stats.map(s => s.reworkPounds);

    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Released (lbs)',
            data: releasedData,
            backgroundColor: 'rgba(30, 64, 175, 0.8)',
            borderColor: 'rgba(30, 64, 175, 1)',
            borderWidth: 1
          },
          {
            label: 'Rework (lbs)',
            data: reworkData,
            backgroundColor: 'rgba(220, 38, 38, 0.8)',
            borderColor: 'rgba(220, 38, 38, 1)',
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
          },
          title: {
            display: true,
            text: `Production Summary - ${this.selectedYear()}`
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Pounds (lbs)'
            }
          }
        }
      }
    };

    this.chart = new Chart(ctx, config);
  }

  formatNumber(num: number): string {
    return num.toLocaleString();
  }
}
