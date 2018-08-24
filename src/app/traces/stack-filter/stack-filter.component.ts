// Barre de filtres avec checkboxes (affichée dans le stack-trace component)

import {
  Component,
  Input,
  OnDestroy,
  OnChanges,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  SimpleChanges,
} from '@angular/core';
import { MatCheckboxChange, MatButtonToggleModule } from '@angular/material';
import {
  Trace,
  TraceCompletion,
  TraceLocation,
  parseTraceLocation,
} from '../../api/interfaces/trace.interface';
import { ViewTypeFilter } from '../../api/interfaces/type-filter.interface';

@Component({
  selector: 'zp-stack-filter',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      .Form--Filter {
        display: flex;
        justify-content: left;
        align-items: center;

        font-weight: bold;
        margin-top: 10px;
        padding-left: 0.5rem;

        .Filter {
          padding-right: 0.25rem;
        }
      }
    `,
  ],
  template: `
    <form class="Form Form--Filter">
      <span>Filter: </span>
      <mat-checkbox *ngFor="let type of types" [checked]="type.selected" (change)="onChangeType($event, type)" name="filter" class="Filter">
        {{type.label}}
      </mat-checkbox>
      <mat-button-toggle-group name="displayStyle" #displayStyle="matButtonToggleGroup" (change)="onChangeDisplay(displayStyle.value)">
        <mat-button-toggle value="Tree" [checked]="toggleValue=='Tree'">
          <mat-icon>call_split</mat-icon>Tree
        </mat-button-toggle>
        <mat-button-toggle value="List" [checked]="toggleValue=='List'">
          <mat-icon>list</mat-icon>List
        </mat-button-toggle>
      </mat-button-toggle-group>
    </form>
  `,
})
export class StackFilterComponent implements OnChanges {
  toggleValue: string = 'Tree';

  @Input() types: ViewTypeFilter[];

  @Output() filteredTraces = new EventEmitter<ViewTypeFilter[]>();
  @Output() filteredDisplay = new EventEmitter();

  ngOnChanges() {}

  onChangeType($event: MatCheckboxChange, type) {
    this.types = this.types.map((value) => {
      if (value.label === type.label) {
        value.selected = $event.checked;
      }
      return value;
    });
    this.filteredTraces.emit(this.types);
  }

  onChangeDisplay(choice: string) {
    this.toggleValue = choice;
    this.filteredDisplay.emit(choice);
  }
}
