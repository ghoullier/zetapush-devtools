import { Injectable, OnInit } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

// Interfaces
import { TreeNode } from '../interfaces/tree.interface';
import { Trace } from '../interfaces/trace.interface';

@Injectable({
  providedIn: 'root',
})
export class TreeBuilder {
  constructor() {}

  // function to set the different lvls of indentation that the traces will take in the tree
  setIndent(traces: Trace[]) {
    let indentCounter: number = 1;
    traces.forEach((element) => {
      if (element.type === 'ME') {
        indentCounter--;
      }
      element.indent = indentCounter;
      if (element.type === 'MS') {
        indentCounter++;
      }
    });
  }

  // auxiliary function calculating the number of child nodes of the one in parameter, or child of the childens ...
  recursiveLength(node: TreeNode): number {
    let length: number = 0;
    node.children.forEach((element) => {
      length += this.recursiveLength(element) + 1;
    });
    return length;
  }

  // auxiliary function converting a Trace input into a Node output
  traceToNode(trace: Trace): TreeNode {
    const node = new TreeNode();
    node.data = trace.data;
    node.name = trace.data.name;
    node.type = trace.type.toString();
    node.children = [];
    node.number = trace.n;
    node.owner = trace.owner;
    node.error = trace.error;

    return node;
  }

  // a function appliyed on an array of traces, to transform it into data that can be displayed by the mat-tree tag
  buildTreeFromTrace(traces: Trace[], begin: number): TreeNode[] {
    let accumulator: TreeNode[] = [];

    let i = begin;
    while (
      i < traces.length - 1 &&
      traces[i + 1].indent >= traces[begin].indent
    ) {
      const node: TreeNode = this.traceToNode(traces[i]);
      if (traces[i].indent < traces[i + 1].indent) {
        node.children = this.buildTreeFromTrace(traces, i + 1);
        i += this.recursiveLength(node);
      }
      accumulator.push(node);
      i++;
    }
    accumulator.push(this.traceToNode(traces[i]));
    return accumulator;
  }
}
