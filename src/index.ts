export interface IAsyncNode {
  id: string;
  run(object?: any): Promise<any>;
  dependencies?: string[];
}

export type IAsyncResultFormatter = (nodes: any) => any;

export class AsyncGraph {
  nodes: IAsyncNode[];
  nodesCount: number;
  resolvedNodes: IAsyncNode[];
  result: any;
  resolveGraph: (any) => void;
  formatter: IAsyncResultFormatter;

  constructor() {
    this.nodes = [];
    this.resolvedNodes = [];
    this.result = {};
    this.formatter = result => result;
  }

  public addNode(asyncNode: IAsyncNode) {
    this.nodes.push(asyncNode);
    return this;
  }

  public useFormatter(formatter: IAsyncResultFormatter) {
    this.formatter = formatter;
  }

  public async resolve() {
    this.nodesCount = this.nodes.length;

    this.resolveReadyNodes();

    return new Promise((resolve, reject) => {
      this.resolveGraph = resolve;
    });
  }

  private isReadyToResolve(node: IAsyncNode) {
    return (
      !node.dependencies ||
      node.dependencies.every(
        dep =>
          !!this.resolvedNodes.find(resolvedNode => resolvedNode.id === dep),
      )
    );
  }

  private resolveSingleNode(node: IAsyncNode) {
    return node.run(this.result).then(nodeResult => {
      this.result = {
        ...this.result,
        ...{ [node.id]: nodeResult },
      };
      this.resolvedNodes.push(node);
      this.resolveReadyNodes();
    });
  }

  private resolveReadyNodes() {
    if (this.nodesCount === this.resolvedNodes.length) {
      this.resolveGraph(this.formatter(this.result));
      return;
    }
    this.nodes
      .filter(node => this.isReadyToResolve(node))
      .forEach(node => this.resolveSingleNode(node));

    this.nodes = this.nodes.filter(node => !this.isReadyToResolve(node));
  }
}
