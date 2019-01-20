interface IAsyncNode {
  id: string;
  run(object?: any): Promise<any>;
  dependencies?: string[];
}

// const resolveAsyncNodes = async (nodes, resolvedNodesMap = {}) => {
//   const nodesReadyToBeResolved = nodes.filter(
//     node =>
//       !node.dependencies ||
//       node.dependencies.every(dependency => resolvedNodesMap[dependency]),
//   );
//   const unresolvedNodes = nodes.filter(
//     node => !nodesReadyToBeResolved.includes(node),
//   );
//   const result = {};

//   await Promise.all(
//     nodesReadyToBeResolved.map(node =>
//       node.run().then(value => {
//         resolvedNodesMap[node.id] = value;
//         return Promise.all(unresolvedNodes.filter(({ dependencies }) =>
//           dependencies.every(dependency => resolvedNodesMap[dependency]),
//         );
//       }),
//     ),
//   );

//   return result;
// };
// export class AsyncGraph {
//   nodes: IAsyncNode[];
//   resolvedNodeValues: {};

//   constructor() {
//     this.nodes = [];
//     this.resolvedNodeValues = {};
//   }

//   addNode(asyncNode: IAsyncNode) {
//     this.nodes.push(asyncNode);
//     return this;
//   }

//   async resolve() {
//     return this.resolvedNodeValues;
//   }
// }

export class AsyncGraph {
  unReslovedNodes: IAsyncNode[];
  readyToResolveNodes: IAsyncNode[];
  resolvedNodes: IAsyncNode[];
  resolvedNodesValues: {};
  graphResolved: Promise<any>;

  constructor() {
    this.unReslovedNodes = [];
    this.readyToResolveNodes = [];
    this.resolvedNodes = [];
    this.resolvedNodesValues = {};
    this.graphResolved = new Promise(() => {
      return this.resolvedNodesValues;
    });
  }

  addNode(asyncNode: IAsyncNode) {
    this.unReslovedNodes.push(asyncNode);
    return this;
  }

  async resolve() {
    this.readyToResolveNodes = [...this.unReslovedNodes.filter(node => isReadyToResolve(node)), ...this.readyToResolveNodes];
    this.unReslovedNodes = this.unReslovedNodes.filter(node => !isReadyToResolve(node));
    return this.graphResolved;
  }
}
