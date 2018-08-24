import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

// Feature modules
import { UiModule } from '../ui.module';
import { SharedModule } from '../shared/shared.module';
import { MatTreeModule } from '@angular/material/tree';
import { ClipboardModule } from 'ngx-clipboard';

// Routing
import { TracesRoutingModule } from './traces-routing.module';

// Components
import { TracesViewComponent } from './traces-view/traces-view.component';
import { StackTraceComponent } from './stack-trace/stack-trace.component';
import { StackListComponent } from './stack-list/stack-list.component';
import { StackTreeComponent } from './stack-tree/stack-tree.component';
import { StackFilterComponent } from './stack-filter/stack-filter.component';

@NgModule({
  imports: [
    CommonModule,
    TracesRoutingModule,
    UiModule,
    SharedModule,
    MatTreeModule,
    ClipboardModule,
  ],
  declarations: [
    TracesViewComponent,
    StackTraceComponent,
    StackListComponent,
    StackTreeComponent,
    StackFilterComponent,
  ],
  providers: [],
})
export class TracesModule {}
