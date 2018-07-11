// component d'affichage du tableau des traces

import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';

// Utils
import { MatSort } from '@angular/material';
import { DataSource } from '@angular/cdk/collections';
import { ActivatedRoute } from '@angular/router';
import { Authentication, Client, services as SERVICES } from 'zetapush-js';

import { saveAs } from 'file-saver';
import { NGXLogger } from 'ngx-logger';

import { MatTreeNestedDataSource } from '@angular/material/tree';

// RxJS
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';
import 'rxjs/add/observable/merge';
import { Subscription } from 'rxjs/Subscription';
import { combineLatest } from 'rxjs/operators/combineLatest';
import { map } from 'rxjs/operators/map';

// Service
import { PreferencesStorage } from '../../api/services/preferences-storage.service';
import { TreeBuilder } from '../../api/services/tree-building.service';

// Interfaces
import {
  Trace,
  TraceCompletion,
  TraceLocation,
  parseTraceLocation,
  TraceType,
} from '../../api/interfaces/trace.interface';
import { TreeNode } from '../../api/interfaces/tree.interface';

export class TraceDataSource extends DataSource<Trace> {
  private _filter = new BehaviorSubject<string>('');
  private _renderData = new BehaviorSubject<Trace[]>([]);

  _renderChangesSubscription: Subscription;
  filteredData: Trace[];

  set filter(filter: string) {
    this._filter.next(filter);
  }
  get filter(): string {
    return this._filter.value;
  }

  constructor(
    private _subject: BehaviorSubject<Trace[]>,
    private logger: NGXLogger,
  ) {
    super();
    this._updateChangeSubscription();
    this.logger.warn('TraceDataSource::constructor', _subject);
  }
  /** Connect function called by the table to retrieve one stream containing the data to render. */
  connect(): Observable<Trace[]> {
    const changes = [this._renderData];
    return Observable.merge(...changes);
  }

  disconnect() {}

  /**
   * Subcribe to changes, to update table when filter is updated
   */
  _updateChangeSubscription() {
    if (this._renderChangesSubscription) {
      this._renderChangesSubscription.unsubscribe();
    }

    // Watch for base data or filter changes to provide a filtered set of data.
    this._renderChangesSubscription = this._subject
      .pipe(
        combineLatest(this._filter),
        map(([data]) => this._filterData(data)),
      )
      .subscribe((data) => this._renderData.next(data));
  }

  /**
   * Checks if name or owner matches the data sources filter string
   */
  filterPredicate: ((data: any, filter: string) => boolean) = (
    data: any,
    filter: string,
  ): boolean => {
    const name = data.data.name.toLowerCase();
    const owner = data.owner.toLowerCase();
    const transformedFilter = filter.trim().toLowerCase();

    return (
      name.includes(transformedFilter) || owner.includes(transformedFilter)
    );
  };

  /**
   * Returns a filtered data array corresponding to the filter string.
   * If no filter provided, returns the same array
   */
  _filterData(data) {
    this.filteredData = !this.filter
      ? data
      : data.filter((obj) => this.filterPredicate(obj, this.filter));

    return this.filteredData;
  }
}

@Component({
  selector: 'zp-traces-view',
  templateUrl: 'traces-view.component.html',
  styleUrls: ['traces-view.component.scss'],
})
export class TracesViewComponent implements OnDestroy, OnInit {
  sandboxId: string;
  traces: any[] = [];
  map = new Map<number, Trace[]>();
  client: Client;
  connected = false;
  subject = new BehaviorSubject<Trace[]>([]);
  source: TraceDataSource | null;
  columns = ['ctx', 'actions', 'ts', 'name', 'owner'];
  selection: Trace[];
  // treeInput: MatTreeNestedDataSource<TreeNode>; // variable à injecter dans la stack-trace
  services: string[] = [];

  constructor(
    private preferences: PreferencesStorage,
    private route: ActivatedRoute,
    private logger: NGXLogger,
  ) // private builder: TreeBuilder, ////
  {
    route.params.subscribe(({ sandboxId }) => {
      this.logger.log('TraceViewComponent::route.params', sandboxId);
      this.sandboxId = sandboxId;
    });
    route.data.subscribe(({ services, status }) => {
      this.logger.log('TraceViewComponent::route.data', services, status);
      this.services = services;
    });
    // this.treeInput = new MatTreeNestedDataSource(); ////
  }

  createTraceObservable(
    client: Client,
    dictionnary: Map<number, Trace[]>,
    deploymentId = SERVICES.Macro.DEFAULT_DEPLOYMENT_ID,
  ): Observable<Trace[]> {
    return new Observable((observer) => {
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
              this.logger.error(trace);
            }
            const traces = Array.from(dictionnary.entries())
              .map(([ctx, list]) =>
                list
                  .filter(Boolean)
                  .find((element) => element.type === TraceType.MACRO_START),
              )
              .filter(Boolean);
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
    this.source = new TraceDataSource(this.subject, this.logger);
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
    this.client.onSuccessfulHandshake((authentication) => {
      this.logger.log('onSuccessfulHandshake', authentication);
      this.connected = true;
    });
    this.client.connect();
    // Enable subscription for all deployed services
    this.services.forEach((deploymentId) =>
      this.createTraceObservable(this.client, this.map, deploymentId).subscribe(
        (traces) => this.subject.next(traces),
      ),
    );
  }
  ngOnDestroy() {
    this.client.disconnect();
  }
  onClearClick() {
    this.logger.log('TraceViewComponent::onClearClick');
    this.map.clear();
    this.traces = [];
    this.subject.next(this.traces);
    this.selection = null;
  }
  onShowClick(trace: Trace) {
    this.logger.log('TraceViewComponent::onShowClick', trace);
    const traces = this.map.get(trace.ctx).filter((truthy) => truthy);
    this.logger.log('TraceViewComponent::onShowClick', traces);
    this.selection = traces;
    //this.builder.setIndex(this.selection); //
    //this.treeInput.data = this.builder.buildTreeFromTrace(this.selection, 0);//
  }
  onDownloadClick(trace: Trace) {
    this.logger.log('TraceViewComponent::onDownloadClick', trace);
    if (trace.type === TraceType.MACRO_START) {
      const filename = `${this.sandboxId}_${trace.ctx}_${trace.data.name}.log`;
      const identity = (truthy) => truthy;
      const stringify = (object) => JSON.stringify(object);
      const append = (suffix) => (value) => `${value}${suffix}`;
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
    this.logger.log('TraceViewComponent::onExportClick', trace);
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
          sudo user call ${data.name}(${JSON.stringify(
          data.parameters,
          null,
          2,
        )});
        }`,
      ];
      const blob = new Blob(content, {
        type: 'application/octet-stream',
      });
      saveAs(blob, `${name}.zms`);
    }
  }
  onFiltering(filterValue: string) {
    filterValue = filterValue.trim();
    this.source.filter = filterValue;
  }
}
