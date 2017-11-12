import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { MatSort } from '@angular/material';
import { DataSource } from '@angular/cdk/collections';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';
import { ActivatedRoute } from '@angular/router';
import { Authentication, Client, services as SERVICES } from 'zetapush-js';
import { saveAs } from 'file-saver';

import { PreferencesStorage } from './preferences-storage.service';
import {
  Trace,
  TraceCompletion,
  TraceLocation,
  parseTraceLocation,
  TraceType,
} from './trace.interface';

import 'rxjs/add/observable/of';
import 'rxjs/add/observable/merge';
import 'rxjs/add/operator/map';

export class TraceDataSource extends DataSource<Trace> {
  constructor(private _subject: BehaviorSubject<Trace[]>) {
    super();
    console.warn('TraceDataSource::constructor', _subject);
  }
  /** Connect function called by the table to retrieve one stream containing the data to render. */
  connect(): Observable<Trace[]> {
    const changes = [this._subject];
    return Observable.merge(...changes);
  }

  disconnect() {}
}

@Component({
  selector: 'zp-trace-view',
  template: `
    <mat-sidenav-container class="Container--Sidenav">
      <h1>
        <mat-icon mat-list-icon [routerLink]="['/sandboxes']">arrow_back</mat-icon>
        <span>Trace for {{sandboxId}}</span>
      </h1>
      <zp-debug-form [sandboxId]="sandboxId" [services]="services"></zp-debug-form>
      <mat-toolbar>
        <span>Actions</span>
        <span class="Spacer"></span>
        <button mat-icon-button>
          <mat-icon aria-label="Clear trace list" (click)="onClearClick()">clear</mat-icon>
        </button>
      </mat-toolbar>
      <mat-table #table [dataSource]="source" class="Table">
        <!-- Ctx Column -->
        <ng-container matColumnDef="ctx">
          <mat-header-cell class="HeaderCell HeaderCell--Ctx" *matHeaderCellDef> Id </mat-header-cell>
          <mat-cell class="Cell Cell--Ctx" *matCellDef="let row">
            {{row.ctx}}
          </mat-cell>
        </ng-container>
        <!-- Actions Column -->
        <ng-container matColumnDef="actions">
          <mat-header-cell class="HeaderCell HeaderCell--Actions" *matHeaderCellDef> Actions </mat-header-cell>
          <mat-cell class="Cell Cell--Actions" *matCellDef="let row">
            <mat-icon mat-list-icon (click)="onDownloadClick(row)">get_app</mat-icon>
            <mat-icon mat-list-icon (click)="onExportClick(row)">bug_report</mat-icon>
            <mat-icon mat-list-icon (click)="onShowClick(row);sidenav.toggle()">launch</mat-icon>
          </mat-cell>
        </ng-container>
        <!-- Ts Column -->
        <ng-container matColumnDef="ts">
          <mat-header-cell class="HeaderCell HeaderCell--Ts" *matHeaderCellDef> Date </mat-header-cell>
          <mat-cell class="Cell Cell--Ts" *matCellDef="let row">
            {{row.ts | date:'mediumTime'}}
          </mat-cell>
        </ng-container>
        <!-- Location Column -->
        <ng-container matColumnDef="location">
          <mat-header-cell class="HeaderCell HeaderCell--Location" *matHeaderCellDef> Location </mat-header-cell>
          <mat-cell class="Cell Cell--Location" *matCellDef="let row">
            {{row.location.recipe}}@{{row.location.version}}:{{row.location.path}}
          </mat-cell>
        </ng-container>
        <!-- Owner Column -->
        <ng-container matColumnDef="owner">
          <mat-header-cell class="HeaderCell HeaderCell--Owner" *matHeaderCellDef> Owner </mat-header-cell>
          <mat-cell class="Cell Cell--Owner" *matCellDef="let row">
            {{row.owner}}
          </mat-cell>
        </ng-container>

        <mat-header-row *matHeaderRowDef="columns"></mat-header-row>
        <mat-row *matRowDef="let row; columns: columns;" class="Table__Row"></mat-row>
      </mat-table>

      <mat-sidenav #sidenav mode="over" position="end">
        <zp-stack-trace [traces]="selection"></zp-stack-trace>
      </mat-sidenav>
    </mat-sidenav-container>
  `,
  styles: [
    `
    .Spacer {
      flex: 1 1 auto;
    }
    .Table {
      height: 80vh;
      border: 1px dashed rgba(0,0,0,.12);
      overflow-y: scroll;
    }
    .Table__Body {
    }
    .Table__Row {
    }
    .Container--Sidenav {
      height: 100vh;
    }
    .Container--Sidenav mat-sidenav {
      max-width: 75vw;
      padding: 1rem;
    }
    .Container--Sidenav .mat-sidenav-content,
    .Container--Sidenav mat-sidenav {
      display: flex;
      overflow-y: scroll;
    }
    .HeaderCell--Location,
    .Cell--Location {
      flex-grow: 2;
    }
    .Cell--Actions mat-icon {
      cursor: pointer;
    }
  `,
  ],
})
export class TraceViewComponent implements OnDestroy, OnInit {
  sandboxId: string;
  traces: any[] = [];
  map = new Map<number, Trace[]>();
  client: Client;
  connected = false;
  subject = new BehaviorSubject<Trace[]>([]);
  source: TraceDataSource | null;
  columns = ['ctx', 'actions', 'ts', 'location', 'owner'];
  selection: Trace[];
  services: string[] = [];

  constructor(
    private preferences: PreferencesStorage,
    private route: ActivatedRoute,
  ) {
    route.params.subscribe(({ sandboxId }) => {
      console.log('TraceViewComponent::route.params', sandboxId);
      this.sandboxId = sandboxId;
    });
    route.data.subscribe(({ services }) => {
      console.log('TraceViewComponent::route.data', services);
      this.services = services;
    });
  }

  createTraceObservable(
    client: Client,
    dictionnary: Map<number, Trace[]>,
    deploymentId = SERVICES.Macro.DEFAULT_DEPLOYMENT_ID,
  ): Observable<Trace[]> {
    return new Observable(observer => {
      const api = client.createService({
        Type: SERVICES.Macro,
        deploymentId,
        listener: {
          trace: (message: TraceCompletion) => {
            const trace = {
              ...message.data,
              location: parseTraceLocation(message.data.location),
              ts: Date.now(),
            };
            try {
              const { level, ...infos } = trace;
              const queue = dictionnary.has(trace.ctx)
                ? dictionnary.get(trace.ctx)
                : [];
              queue[trace.n] = trace;
              dictionnary.set(trace.ctx, queue);
            } catch (e) {
              // console.log(trace);
            }
            const traces = Array.from(dictionnary.entries())
              .map(([ctx, list]) => {
                return list[1];
              })
              .filter(element => element);
            observer.next(traces);
          },
        },
      });
      return () => {
        client.unsubscribe(api);
      };
    });
  }

  ngOnInit() {
    this.source = new TraceDataSource(this.subject /*, this.sort*/);
    const credentials = this.preferences.getCredentials();
    this.client = new Client({
      apiUrl: `${credentials.apiUrl}/zbo/pub/business/`,
      sandboxId: this.sandboxId,
      authentication: () =>
        Authentication.create({
          authType: 'developer',
          deploymentId: 'developer',
          login: credentials.username,
          password: credentials.password,
        }),
    });
    this.client.onSuccessfulHandshake(authentication => {
      console.log('onSuccessfulHandshake', authentication);
      this.connected = true;
    });
    this.client.connect();
    // Enable subscription for all deployed services
    this.services.forEach(deploymentId =>
      this.createTraceObservable(this.client, this.map, deploymentId).subscribe(
        traces => this.subject.next(traces),
      ),
    );
  }
  ngOnDestroy() {
    this.client.disconnect();
  }
  onClearClick() {
    console.log('TraceViewComponent::onClearClick');
    this.map.clear();
    this.traces = [];
    this.subject.next(this.traces);
    this.selection = null;
  }
  onShowClick(trace: Trace) {
    console.log('TraceViewComponent::onShowClick', trace);
    const traces = this.map.get(trace.ctx).filter(truthy => truthy);
    console.log('TraceViewComponent::onShowClick', traces);
    this.selection = traces;
  }
  onDownloadClick(trace: Trace) {
    console.log('TraceViewComponent::onDownloadClick', trace);
    if (trace.type === TraceType.MACRO_START) {
      const filename = `${this.sandboxId}_${trace.ctx}_${trace.data.name}.log`;
      const identity = truthy => truthy;
      const stringify = object => JSON.stringify(object);
      const append = suffix => value => `${value}${suffix}`;
      const traces = this.map
        .get(trace.ctx)
        .filter(identity)
        .map(stringify)
        .map(append('\n'));
      const blob = new Blob(traces, {
        type: 'text/plain;charset=utf-8',
      });
      saveAs(blob, filename);
    }
  }
  onExportClick(trace: Trace) {
    console.log('TraceViewComponent::onExportClick', trace);
    if (trace.type === TraceType.MACRO_START) {
      const { data } = trace;
      const name = `test_${data.name}`;
      const content = [
        `zms_test ${name} {
  zms_test_setup {
    zms_test_user user = zpRecipeUser::zpServiceSimpleAuth({
      login: '<CHANGE-ME>',
      password: '<CHANGE-ME>'
    });
  }
  zms_add_handler(user, ${data.name}, (response, errors) => {
    info(${data.name}.name, response, errors);

    assert coll:size(errors) == 0 'CALL_MACRO_FAILED';

    zms_test_success;
  });
  sudo user call ${data.name}(${JSON.stringify(data.parameters, null, 2)});
}`,
      ];
      const blob = new Blob(content, {
        type: 'application/octet-stream',
      });
      saveAs(blob, `${name}.zms`);
    }
  }
}
