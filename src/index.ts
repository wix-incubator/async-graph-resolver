import {
  DuplicateNodeIdError,
  InvalidDependenciesError,
  CircularDependencyError,
} from './errors';

export interface IAsyncNode {
  id: string;
  run(object?: any): Promise<any>;
  dependencies?: string[];
}

interface INodeData {
  nodeDependencyPromises: Promise<any>;
  nodePromise: Promise<any>;
}

export class AsyncGraph {
  private readonly nodePromises: Map<string, INodeData> | {} = {};
  private readonly dependenciesGraph: Map<string, string[]> | {} = {};
  private resolveRootPromise: () => void;
  private readonly rootPromise: Promise<any> = new Promise(resolve => {
    this.resolveRootPromise = resolve;
  });
  private readonly result: any = {};
  private isGraphExecutionAborted: boolean = false;

  private addToDependenciesGraph(dependency, dependant) {
    if (this.dependenciesGraph.hasOwnProperty(dependency)) {
      this.dependenciesGraph[dependency].push(dependant);
    } else {
      this.dependenciesGraph[dependency] = [dependant];
    }
  }

  private abortGraphExecution(reason) {
    this.isGraphExecutionAborted = true;
    throw reason;
  }

  private getNodePromise(id: string, run: (object?: any) => Promise<any>) {
    return this.rootPromise
      .then(() => Promise.all(this.nodePromises[id].nodeDependencyPromises))
      .then(() => {
        if (!this.isGraphExecutionAborted) {
          return run(this.result).then(nodeResult => {
            this.result[id] = nodeResult;
          });
        }
      })
      .catch(reason => this.abortGraphExecution(reason));
  }

  private buildPromisesGraph() {
    Object.keys(this.dependenciesGraph).forEach(dependencyId => {
      const dependencyPromise = this.nodePromises[dependencyId].nodePromise;
      const dependantIds: string[] = this.dependenciesGraph[dependencyId];
      dependantIds.forEach(dependantId =>
        this.nodePromises[dependantId].nodeDependencyPromises.push(
          dependencyPromise,
        ),
      );
    });
  }

  private getGraphPromise() {
    const nodesPromises: Promise<any>[] = Object.keys(this.nodePromises).map(
      nodeId => this.nodePromises[nodeId].nodePromise,
    );

    return Promise.all(nodesPromises).then(() => {
      return this.result;
    });
  }

  private addNodePromise(id, run) {
    this.nodePromises[id] = {
      nodeDependencyPromises: [],
      nodePromise: this.getNodePromise(id, run),
    };
  }

  private mapNodeIdToDependencyIds(id, dependencies) {
    dependencies.forEach(dependencyId =>
      this.addToDependenciesGraph(dependencyId, id),
    );
  }

  private validateUniqueNodeId(id) {
    if (Object.keys(this.nodePromises).includes(id)) {
      throw DuplicateNodeIdError(id);
    }
  }

  private validateAllDependenciesExists() {
    const allNodeIds = Object.keys(this.nodePromises);
    const allDependeciesIds = Object.keys(this.dependenciesGraph);
    const nonExistingDependencies = allDependeciesIds.filter(
      dependencyId => !allNodeIds.includes(dependencyId),
    );
    if (nonExistingDependencies.length > 0) {
      throw InvalidDependenciesError(nonExistingDependencies);
    }
  }

  private validateDependencyIsntInACircle(dependencyId, path: string[]) {
    if (path.includes(dependencyId)) {
      const circularPath = path.slice(path.indexOf(dependencyId));
      throw CircularDependencyError([...circularPath, dependencyId]);
    }
    if (this.dependenciesGraph[dependencyId]) {
      this.dependenciesGraph[dependencyId].forEach(depedantId =>
        this.validateDependencyIsntInACircle(depedantId, [
          ...path,
          dependencyId,
        ]),
      );
    }
  }

  private validateNoCircularDependencies() {
    Object.keys(this.dependenciesGraph).forEach(dependencyId =>
      this.validateDependencyIsntInACircle(dependencyId, []),
    );
  }

  constructor() {
    this.resolve = this.resolve.bind(this);
    this.addNode = this.addNode.bind(this);
  }

  public addNode({ id, run, dependencies = [] }: IAsyncNode) {
    this.validateUniqueNodeId(id);
    this.addNodePromise(id, run);
    this.mapNodeIdToDependencyIds(id, dependencies);
    return this;
  }

  public resolve() {
    this.validateAllDependenciesExists();
    this.validateNoCircularDependencies();

    this.buildPromisesGraph();
    this.resolveRootPromise();

    return this.getGraphPromise();
  }
}
