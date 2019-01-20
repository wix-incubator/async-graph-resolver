interface IAsyncNode {
  id: string;
  run(object?: any): Promise<any>;
  dependencies?: string[];
}

export class AsyncGraph {
  nodes: IAsyncNode[];
  nodesCount: number;
  resolvedNodes: IAsyncNode[];
  resolvedNodesValues: {};
  graphResolved: Promise<any>;
  resolveGraph: (any) => void;

  constructor() {
    this.nodes = [];
    this.resolvedNodes = [];
    this.resolvedNodesValues = {};
  }

  addNode(asyncNode: IAsyncNode) {
    this.nodes.push(asyncNode);
    return this;
  }

  isReadyToResolve(node: IAsyncNode) {
    return (
      !node.dependencies ||
      node.dependencies.every(
        dep => !!this.resolvedNodes.find(rnode => rnode.id === dep),
      )
    );
  }

  resolveSingleNode(node: IAsyncNode) {
    return node.run(this.resolvedNodesValues).then(result => {
      this.resolvedNodesValues = {
        ...this.resolvedNodesValues,
        ...{ [node.id]: result },
      };
      this.resolvedNodes.push(node);
      this.resolveReadyNodes();
    });
  }

  resolveReadyNodes() {
    if (this.nodesCount === this.resolvedNodes.length) {
      this.resolveGraph(this.resolvedNodesValues);
      return;
    }
    this.nodes
      .filter(node => this.isReadyToResolve(node))
      .forEach(node => this.resolveSingleNode(node));

    this.nodes = this.nodes.filter(node => !this.isReadyToResolve(node));
  }

  async resolve() {
    this.nodesCount = this.nodes.length;

    this.resolveReadyNodes();

    return new Promise((resolve, reject) => {
      this.resolveGraph = resolve;
    });
  }
}
