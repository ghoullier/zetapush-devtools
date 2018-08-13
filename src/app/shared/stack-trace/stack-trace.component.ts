import { Component, Input, Output, EventEmitter } from '@angular/core';

// Interface
import { Trace } from '../../api/interfaces/trace.interface';
import { ViewTypeFilter } from '../../api/interfaces/type-filter.interface';

@Component({
  selector: 'zp-stack-trace',
  template: `
    <span class="navigation">
      <button mat-raised-button (click)="onNavigationClick('prev')" [disabled] = "filtered[1]?.ctx == traceMin">
        <mat-icon>navigate_before</mat-icon>
      </button>
      <button mat-raised-button (click)="onNavigationClick('next')" [disabled] = "filtered[1]?.ctx == traceMax">
        <mat-icon>navigate_next</mat-icon>
      </button>
      <span class="trace-info">
        <p><strong>Trace ID : </strong>{{filtered[1]?.ctx}}</p>
        <p><strong>owner : </strong>{{filtered[1]?.owner}}</p>
      </span>
    </span>
    <zp-stack-filter [traces]="traces" [types]="types" (filteredTraces)="filterTraces($event)"></zp-stack-filter>
    <table>
      <thead>
        <tr>
          <th>N</th>
          <th>Type</th>
          <th>Content</th>
          <th>Owner</th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let trace of filtered" [ngClass]="['Trace', 'Trace--' + trace.type]">
          <td>{{trace.n}}</td>
          <td>{{trace.type}}</td>
          <td>
            <zp-lazy-json *ngIf="trace.type == 'MS'" [value]="trace.data" [placeholder]="trace.data.name"></zp-lazy-json>
            <zp-lazy-json *ngIf="trace.type == 'ME'" [value]="trace.data" [placeholder]="trace.data.name"></zp-lazy-json>
            <zp-lazy-json *ngIf="trace.type == 'USR'" [value]="trace.data"></zp-lazy-json>
            <pre *ngIf="trace.type == 'CMT'">{{trace.data}}</pre>
          </td>
          <td>{{trace.owner}}</td>
        </tr>
      </tbody>
    </table>
  `,
  styleUrls: ['stack-trace.component.scss'],
})
export class StackTraceComponent {
  filtered: Trace[] = [];
  types: ViewTypeFilter[] = [
    { label: 'MS', selected: true },
    { label: 'ME', selected: true },
    { label: 'CMT', selected: false },
    { label: 'USR', selected: true },
  ];

  @Input() traces: Trace[] = [];
  @Input() traceMin = 0;
  @Input() traceMax = 9999;

  @Output() traceNavigation = new EventEmitter<string>();

  filterTraces(filteredTraces: Trace[]) {
    this.filtered = filteredTraces;
  }

  onNavigationClick(direction: string) {
    if (direction == 'next') {
      this.traceNavigation.emit('next');
    } else if (direction == 'prev') {
      this.traceNavigation.emit('prev');
    }
  }
}
