import { Component, OnInit, Input } from '@angular/core';

// Tree
import { NestedTreeControl } from '@angular/cdk/tree';
import { MatTreeNestedDataSource } from '@angular/material/tree';

// Interfaces
import { TreeNode } from '../../api/interfaces/tree.interface';
import { ViewTypeFilter } from '../../api/interfaces/type-filter.interface';
import { Trace } from '../../api/interfaces/trace.interface';

// RxJS
import { of as observableOf } from 'rxjs';

// Service
import { TreeBuilder } from '../../api/services/tree-building.service';

@Component({
  selector: 'zp-stack-tree',
  templateUrl: './stack-tree.component.html',
  styleUrls: ['./stack-tree.component.css', './stack-tree.component.scss'],
})
export class StackTreeComponent implements OnInit {
  @Input() traces: Trace[] = [];
  nestedTreeControl: NestedTreeControl<TreeNode>;
  nestedDataSource: MatTreeNestedDataSource<TreeNode>;
  @Input() filter: ViewTypeFilter[];

  constructor(private builder: TreeBuilder) {
    this.nestedTreeControl = new NestedTreeControl<TreeNode>(this._getChildren);
    this.nestedDataSource = new MatTreeNestedDataSource();
  }

  ngOnChanges() {
    if (this.traces.length) {
      this.builder.setIndent(this.traces);
      this.nestedDataSource.data = this.filterTrace(
        this.builder.buildTreeFromTrace(this.traces, 0),
      );
    }
  }

  ngOnInit() {}

  hasNestedChild = (_: number, nodeData: TreeNode) => nodeData.children.length;

  // return the tree with only the filtered nodes.
  filterTrace = (treeData: TreeNode[]) => {
    let filteredTree: TreeNode[] = [];
    for (let i = 0; i < treeData.length; i++) {
      if (this.isFiltered(treeData[i])) {
        let node: TreeNode = treeData[i];
        node.children = this.filterTrace(treeData[i].children);
        filteredTree.push(node);
      }
    }
    return filteredTree;
  };

  // return true if the data node is to be displayed
  isFiltered = (nodeData: TreeNode) => {
    let filterOn: boolean = true;
    this.filter.map((value) => {
      if (value.label == nodeData.type) {
        filterOn = value.selected;
      }
    });
    return filterOn;
  };

  private _getChildren = (node: TreeNode) => observableOf(node.children);
}
