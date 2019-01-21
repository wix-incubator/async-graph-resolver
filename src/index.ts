export interface IAsyncNode {
  id: string;
  run(object?: any): Promise<any>;
  dependencies?: string[];
}

export type IAsyncResultFormatter = (nodes: any) => any;

export class AsyncGraph {
  private readonly nodes: IAsyncNode[];
  private unresolvedNodes: IAsyncNode[];
  private result: any;
  private resolveGraph: (any) => void;
  private formatter: IAsyncResultFormatter;

  constructor() {
    this.nodes = [];
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
    this.unresolvedNodes = [...this.nodes];
    this.result = {};

    this.resolveReadyNodes();

    return new Promise((resolve, reject) => {
      this.resolveGraph = resolve;
    });
  }

  private isReadyToResolve(node: IAsyncNode) {
    return (
      !node.dependencies ||
      node.dependencies.every(dep => this.result.hasOwnProperty(dep))
    );
  }

  private resolveSingleNode(node: IAsyncNode) {
    return node.run(this.result).then(nodeResult => {
      this.result = {
        ...this.result,
        ...{ [node.id]: nodeResult },
      };
      this.resolveReadyNodes();
    });
  }

  private resolveReadyNodes() {
    if (this.nodes.length === Object.keys(this.result).length) {
      this.resolveGraph(this.formatter(this.result));
      return;
    }
    this.unresolvedNodes
      .filter(node => this.isReadyToResolve(node))
      .forEach(node => this.resolveSingleNode(node));

    this.unresolvedNodes = this.unresolvedNodes.filter(
      node => !this.isReadyToResolve(node),
    );
  }
}
