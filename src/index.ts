import { DuplicateNodeIdError, CircularDependencyError } from './errors';

export interface IAsyncNode {
  id: string;
  run(object?: any): Promise<any>;
  dependencies?: string[];
}

export type IAsyncResultFormatter = (nodes: any) => any;

const hasCircularDependencies = (nodes: IAsyncNode[], node: IAsyncNode) => {
  const flattenedDependencies = new Set();

  const internalSearch = ({ id, dependencies }: IAsyncNode) => {
    if (flattenedDependencies.has(id)) {
      return true;
    }
    flattenedDependencies.add(id);
    const hasCircularDepndency = dependencies.some(_id => {
      const dependecyNode = nodes.find(_node => _node.id === _id);
      if (!dependecyNode) {
        return false;
      }
      return internalSearch(dependecyNode);
    });
    if (!hasCircularDepndency) {
      flattenedDependencies.delete(id);
    }
    return hasCircularDepndency;
  };

  return internalSearch(node);
};

export class AsyncGraph {
  private readonly nodes: IAsyncNode[];
  private unresolvedNodes: IAsyncNode[];
  private result: any;
  private resolveGraph: () => void;
  private formatter: IAsyncResultFormatter;
  private graphPromise: Promise<any>;

  constructor() {
    this.nodes = [];
    this.formatter = result => result;
  }

  private validateNode(unverifiedNode: IAsyncNode) {
    const hasUniqueId = !this.nodes.some(node => node.id === unverifiedNode.id);
    if (!hasUniqueId) {
      throw DuplicateNodeIdError(unverifiedNode);
    }

    const hasCircularDependency = hasCircularDependencies(
      this.nodes.concat(unverifiedNode),
      unverifiedNode,
    );
    if (hasCircularDependency) {
      throw CircularDependencyError(unverifiedNode);
    }
  }

  public addNode({ id, run, dependencies = [] }: IAsyncNode) {
    const asyncNode = { id, run, dependencies };
    this.validateNode(asyncNode);
    this.nodes.push(asyncNode);
    return this;
  }

  public useFormatter(formatter: IAsyncResultFormatter) {
    this.formatter = formatter;
  }

  public async resolve() {
    if (!this.graphPromise) {
      this.unresolvedNodes = [...this.nodes];
      this.result = {};

      this.resolveReadyNodes();

      this.graphPromise = new Promise((resolve, reject) => {
        this.resolveGraph = resolve;
      }).then(() => this.formatter(this.result));
    }

    return this.graphPromise;
  }

  private isReadyToResolve(node: IAsyncNode) {
    return node.dependencies.every(dep => this.result.hasOwnProperty(dep));
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
      this.resolveGraph();
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
