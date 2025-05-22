import { JSONPath } from "tari-extension-common";

interface ItemWithPath {
  path: JSONPath;
}

export interface TreeNode<T extends ItemWithPath> {
  item: T;
  children?: TreeNode<T>[];
}

export function buildTree<T extends ItemWithPath>(outlines: T[]): TreeNode<T>[] {
  const sortedOutlines = [...outlines];
  sortedOutlines.sort((a, b) => a.path.length - b.path.length);

  const rootNodes: TreeNode<T>[] = [];
  const nodeMap = new Map<string, TreeNode<T>>();

  for (const outline of sortedOutlines) {
    const newNode: TreeNode<T> = { item: outline };
    const currentPath = outline.path;
    const currentPathKey = JSON.stringify(currentPath);
    nodeMap.set(currentPathKey, newNode);

    if (currentPath.length === 0) {
      rootNodes.push(newNode);
    } else {
      let parentNode: TreeNode<T> | undefined = undefined;
      let parentPath = currentPath.slice(0, currentPath.length - 1);

      while (parentPath.length > 0) {
        const parentPathKey = JSON.stringify(parentPath);
        parentNode = nodeMap.get(parentPathKey);
        if (parentNode) {
          parentNode.children = parentNode.children ?? [];
          parentNode.children.push(newNode);
          break;
        }
        if (parentPath.length > 0) {
          parentPath = parentPath.slice(0, parentPath.length - 1);
        } else {
          break;
        }
      }

      if (!parentNode) {
        rootNodes.push(newNode);
      }
    }
  }

  return rootNodes;
}
