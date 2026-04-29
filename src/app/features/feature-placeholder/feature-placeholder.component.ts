import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs';

@Component({
  selector: 'app-feature-placeholder',
  standalone: false,
  templateUrl: './feature-placeholder.component.html',
  styleUrl: './feature-placeholder.component.css'
})
export class FeaturePlaceholderComponent {
  readonly title$: Observable<string>;
  readonly description$: Observable<string>;

  constructor(private readonly route: ActivatedRoute) {
    this.title$ = this.route.data.pipe(map((data) => String(data['title'] ?? 'feature.placeholder.title')));
    this.description$ = this.route.data.pipe(map((data) => String(data['description'] ?? 'feature.placeholder.description')));
  }
}
