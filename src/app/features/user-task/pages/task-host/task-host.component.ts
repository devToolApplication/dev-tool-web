import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { TaskHostStore } from '../../services/task-host.store';

@Component({
  selector: 'app-task-host',
  standalone: false,
  template: `
    <app-page-shell [title]="store.task()?.taskName || ('userTask.nav.title' | translateContent)">
      <app-task-shell></app-task-shell>
    </app-page-shell>
  `,
  providers: [TaskHostStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskHostComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  readonly store = inject(TaskHostStore);

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const taskId = params.get('taskId');
      if (taskId) {
        void this.store.load(taskId);
      }
    });
  }
}