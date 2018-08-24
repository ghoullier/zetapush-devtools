import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { StackTreeComponent } from './stack-tree.component';

describe('StackTreeComponent', () => {
  let component: StackTreeComponent;
  let fixture: ComponentFixture<StackTreeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [StackTreeComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StackTreeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
