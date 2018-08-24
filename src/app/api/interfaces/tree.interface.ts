/**
 * Json node data with nested structure. Each node has a filename and a value or a list of children
 */
export class TreeNode {
  children: TreeNode[];
  data: any;
  name: string;
  type: string;
  number: number;
  owner: string;
  error?: boolean;
}
