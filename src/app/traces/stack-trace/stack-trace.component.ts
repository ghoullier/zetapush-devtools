// Panneau latéral ouvert lors d'un clic sur une ligne

import { Component, Input } from '@angular/core';

// Interfaces
import { ViewTypeFilter } from '../../api/interfaces/type-filter.interface';
import { Trace } from '../../api/interfaces/trace.interface';

// Tree
import {
  MatTreeNestedDataSource,
  MatNestedTreeNode,
} from '@angular/material/tree';

@Component({
  selector: 'zp-stack-trace',
  template: `
    <zp-stack-filter [types]="types" (filteredTraces)="filterTraces($event)" (filteredDisplay)="filterDisplay($event)"></zp-stack-filter>
    <zp-stack-list *ngIf="display == 'List'" [traces]="traces" [filter]="types"></zp-stack-list>
    <zp-stack-tree *ngIf="display == 'Tree'" [traces]="traces" [filter]="types"></zp-stack-tree>
  `,
  providers: [],
})
export class StackTraceComponent {
  @Input() traces: Trace[] = []; //données injectées par variable selection de trace-view

  filtered: Trace[] = [];
  display: String = 'List';
  types: ViewTypeFilter[] = [
    { label: 'MS', selected: true },
    { label: 'ME', selected: true },
    { label: 'CMT', selected: false },
    { label: 'USR', selected: true },
  ];

  filterTraces(filter: ViewTypeFilter[]) {
    this.types = filter;
  }

  filterDisplay(filteredDisplay: string) {
    this.display = filteredDisplay;
  }
}
