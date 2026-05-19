import { Component, Input } from '@angular/core';

export type LoadingSkeletonType = 'card' | 'table' | 'form' | 'detail' | 'list';

export interface LoadingSkeletonConfig {
  type: LoadingSkeletonType;
  rows?: number;
  columns?: number;
  animated?: boolean;
}

@Component({
  selector: 'app-loading-skeleton',
  standalone: false,
  templateUrl: './loading-skeleton.component.html',
  styleUrl: './loading-skeleton.component.css'
})
export class LoadingSkeletonComponent {
  @Input() type: LoadingSkeletonType = 'card';
  @Input() rows = 4;
  @Input() columns = 4;
  @Input() animated = true;

  get resolvedType(): LoadingSkeletonType {
    return ['card', 'table', 'form', 'detail', 'list'].includes(this.type) ? this.type : 'card';
  }

  get resolvedRows(): number {
    return this.safeCount(this.rows);
  }

  get resolvedColumns(): number {
    return this.safeCount(this.columns);
  }

  sequence(length: number): number[] {
    return Array.from({ length: this.safeCount(length) }, (_, index) => index);
  }

  private safeCount(value: number): number {
    return Number.isFinite(value) ? Math.max(1, Math.floor(value)) : 1;
  }
}
