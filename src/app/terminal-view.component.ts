import { ActivatedRoute } from '@angular/router';
import { Component, OnInit, Input, OnDestroy, ViewChild } from '@angular/core';
import { Authentication, Client, services as SERVICES } from 'zetapush-js';
import { NGXLogger } from 'ngx-logger';
import { Observable } from 'rxjs/Observable';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { ObserversModule } from '@angular/cdk/observers';

import { DebugStatusView } from './debug-form.component';
import { Sandbox } from './sandboxes-resolver.service';
import { PreferencesStorage } from './preferences-storage.service';
import { DebugStatus, DebugStatusApi } from './debug-status-api.service';
import { Trace, TraceCompletion, parseTraceLocation } from './trace.interface';
import { ScrollGlueDirective } from './scrollGlue.directive';

@Component({
  selector: 'zp-terminal',
  styles: [
    `
    .back-link {
      cursor: pointer;
    }
    .terminal {
      max-width: 800px;
      height: 600px;
      padding: 10px;
      margin: 20px auto;
      color: white;
      background-color: black;
      overflow-y: scroll;
      clear: both;
    }
    .terminal-content {
      margin-bottom: 15px;
      white-space: pre-wrap;
    }
    :host /deep/ .string { color: green; }
    :host /deep/ .number { color: darkorange; }
    :host /deep/ .boolean { color: blue; }
    :host /deep/ .null { color: magenta; }
    :host /deep/ .key { color: red; }
    .clear {
      float: right;
    }
  `,
  ],
  template: `
    <div class="terminal-container">
      <h1>
        <mat-icon class="back-link" mat-list-icon [routerLink]="['/sandboxes']">arrow_back</mat-icon>
        <span>Terminal for {{ sandboxId }}</span>
      </h1>
      <zp-debug-form [sandboxId]="sandboxId" [services]="services"></zp-debug-form>
        <button mat-icon-button class="clear">
          <mat-icon aria-label="Clear terminal" (click)="onClearClick()">clear</mat-icon>
        </button>
      <div class="terminal" *ngIf="subject._value.length; else watching" zpScrollGlue>
        <div *ngFor="let output of subject._value">
          <span class="terminal-hour">{{ output.ts | date:'yyyy-MM-dd HH:mm:ss' }}</span>
          <pre class="terminal-content" [innerHtml]="syntaxHighlight(output.data)"></pre>
        </div>
      </div>

      <ng-template #watching>
        <div class="terminal">Waiting for user traces ...</div>
      </ng-template>
    </div>
  `,
  providers: [ScrollGlueDirective],
})
export class TerminalViewComponent implements OnInit, OnDestroy {
  sandboxId: string;
  services: string[] = [];
  traces: any[] = [];
  client: Client;
  subject = new BehaviorSubject<Trace[]>([]);
  connected = false;
  buffer = 1000;

  @Input() sandboxes: Sandbox[];

  @ViewChild(ScrollGlueDirective) messageListRef: ScrollGlueDirective;

  constructor(
    private route: ActivatedRoute,
    private preferences: PreferencesStorage,
    private debug: DebugStatusApi,
    private logger: NGXLogger,
  ) {}

  ngOnInit() {
    this.route.params.subscribe(({ sandboxId }) => {
      this.logger.log('TraceViewComponent::route.params', sandboxId);
      this.sandboxId = sandboxId;
    });
    this.route.data.subscribe(({ services, status }) => {
      this.logger.log('TraceViewComponent::route.data', services, status);
      this.services = services;
    });

    this.connectToSanboxe();
  }

  ngOnDestroy() {
    this.client.disconnect();
  }

  onClearClick() {
    this.logger.log('TraceViewComponent::onClearClick');
    this.traces = [];
    this.subject.next(this.traces);
  }

  createTraceObservable(
    client: Client,
    deploymentId = SERVICES.Macro.DEFAULT_DEPLOYMENT_ID,
  ): Observable<Trace[]> {
    return new Observable(observer => {
      const api = client.createService({
        Type: SERVICES.Macro,
        deploymentId,
        listener: {
          trace: (message: TraceCompletion) => {
            if (message.data && message.data.type === 'USR') {
              const trace = {
                ...message.data,
                location: parseTraceLocation(message.data.location),
                ts: Date.now(),
              };

              this.traces.push(trace);

              // Remove the 100 first entries if traces > buffer
              if (this.traces.length > this.buffer) {
                this.traces = this.traces.slice(100);
              }

              observer.next(this.traces);
            }
          },
        },
      });
      return () => {
        client.unsubscribe(api);
      };
    });
  }

  connectToSanboxe() {
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
      this.logger.log('onSuccessfulHandshake', authentication);
      this.connected = true;
    });
    this.client.connect();

    // Enable subscription for all deployed services
    this.services.forEach(deploymentId =>
      this.createTraceObservable(this.client, deploymentId).subscribe(traces =>
        this.subject.next(traces),
      ),
    );
  }

  syntaxHighlight(json) {
    json = JSON.stringify(json, undefined, 2);
    json = json
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    return json.replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
      match => {
        let cls = 'number';
        if (/^"/.test(match)) {
          if (/:$/.test(match)) {
            cls = 'key';
          } else {
            cls = 'string';
          }
        } else if (/true|false/.test(match)) {
          cls = 'boolean';
        } else if (/null/.test(match)) {
          cls = 'null';
        }
        return '<span class="' + cls + '">' + match + '</span>';
      },
    );
  }
}