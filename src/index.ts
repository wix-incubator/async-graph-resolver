import {
  DuplicateNodeIdError,
  CircularDependencyError,
  InvalidDependencyError,
} from './errors';

export interface IAsyncNode {
  id: string;
  run(object?: any): Promise<any>;
  dependencies?: string[];
}

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
  private hasFailedNodes: boolean;
  private resolveGraph: (error?: Error) => void;
  private graphPromise: Promise<any>;

  constructor() {
    this.nodes = [];
    this.resolve = this.resolve.bind(this);
    this.addNode = this.addNode.bind(this);
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

  private verifyGraphDependencies() {
    const ids = new Set(this.nodes.map(({ id }) => id));
    const dependenciesIds = new Set(
      this.nodes.reduce(
        (dependenciesList, node) => dependenciesList.concat(node.dependencies),
        [],
      ),
    );
    dependenciesIds.forEach(dependencyId => {
      if (!ids.has(dependencyId)) {
        throw InvalidDependencyError(dependencyId);
      }
    });
  }

  public resolve() {
    if (!this.graphPromise) {
      this.unresolvedNodes = [...this.nodes];
      this.result = {};

      this.verifyGraphDependencies();

      this.resolveReadyNodes();

      this.graphPromise = new Promise((resolve, reject) => {
        this.resolveGraph = error =>
          error ? reject(error) : resolve(this.result);
      });
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
    if (
      this.nodes.length === Object.keys(this.result).length ||
      this.hasFailedNodes
    ) {
      return this.resolveGraph();
    }
    this.unresolvedNodes
      .filter(node => this.isReadyToResolve(node))
      .forEach(node =>
        this.resolveSingleNode(node).catch(error => {
          this.hasFailedNodes = true;
          this.resolveGraph(error);
        }),
      );

    this.unresolvedNodes = this.unresolvedNodes.filter(
      node => !this.isReadyToResolve(node),
    );
  }
}
