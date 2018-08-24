import { Component, Input } from '@angular/core';
import { MatSnackBar } from '@angular/material';

@Component({
  selector: 'zp-lazy-json',
  template: `
    <div class="LazyJson" [ngClass]="{'LazyJson--Hidden': !show }" >
      <pre *ngIf="show">{{value | json}}</pre>
      <button mat-icon-button *ngIf="show" ngxClipboard [cbContent]="json" (cbOnSuccess)="onThrowSnackbar()" matTooltip="Copy JSON to clipboard" [matTooltipShowDelay]="400" matTooltipPosition=right>
        <mat-icon aria-label="Modez, copy dat json!">file_copy</mat-icon>
      </button>
      <button mat-icon-button *ngIf="show" (click)="onFoldClick()" matTooltip="Fold JSON" [matTooltipShowDelay]="400" matTooltipPosition=right>
        <mat-icon aria-label="Modez, copy dat json!">import_export</mat-icon>
      </button>
      <button *ngIf="!show" mat-button (click)="onLazyClick()">
        <mat-icon>visibility</mat-icon>
        <span>{{placeholder}}</span>
      </button>
    </div>
  `,
  styles: [
    `
      .LazyJson {
        display: flex;
        align-items: center;
      }
      .LazyJson--Hidden {
      }
      .buttons {
        display: flex;
        flex-direction: column;
        justify-content: center;
      }
    `,
  ],
})
export class LazyJsonComponent {
  @Input() value: any;
  @Input() placeholder = 'Show';

  show = false;
  json: any;

  constructor(private snackBar: MatSnackBar) {}

  ngOnChanges() {
    this.json = JSON.stringify(this.value, null, 2);
  }

  onLazyClick() {
    this.show = true;
  }

  onFoldClick() {
    this.show = false;
  }

  onThrowSnackbar() {
    this.snackBar.open('JSON content copied to clipboard', '', {
      duration: 800,
    });
  }
}
