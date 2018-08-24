import { Component, OnInit, Input } from '@angular/core';

// Interfaces
import { Trace } from '../../api/interfaces/trace.interface';
import { ViewTypeFilter } from '../../api/interfaces/type-filter.interface';

@Component({
  selector: 'zp-stack-list',
  templateUrl: './stack-list.component.html',
  styleUrls: ['./stack-list.component.scss'],
})
export class StackListComponent implements OnInit {
  @Input() traces: Trace[] = [];
  @Input() filter: ViewTypeFilter[];

  constructor() {}

  ngOnInit() {}

  checkFilter(type: string): boolean {
    let filterOn: boolean = true;
    this.filter.map((value) => {
      if (value.label == type) {
        filterOn = value.selected;
      }
    });
    return filterOn;
  }
}
