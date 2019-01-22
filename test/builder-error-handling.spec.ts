import { AsyncGraph } from '../src';
import { expect } from 'chai';

describe('error handling', () => {
  describe('addNode', () => {
    it('should throw an error when adding a node with non-unique id', () => {
      const addNonUniqueNodes = (graph: AsyncGraph) =>
        graph
          .addNode({
            id: 'id1',
            run: Promise.resolve,
          })
          .addNode({
            id: 'id1',
            run: Promise.resolve,
          });

      expect(() => addNonUniqueNodes(new AsyncGraph())).to.throw(
        Error,
        `Async node with id: 'id1' alredy exists`,
      );
    });

    it('should throw an error when adding a node that creates circular dependency to itself', () => {
      const addNodeWithReferenceToItself = (graph: AsyncGraph) =>
        graph.addNode({
          id: 'A',
          run: Promise.resolve,
          dependencies: ['A'],
        });

      expect(() => addNodeWithReferenceToItself(new AsyncGraph())).to.throw(
        Error,
        `Adding async node with id: 'A' creates circular dependency`,
      );
    });

    it('should throw an error when adding a node that creates circular dependency', () => {
      const populateGraphWithCircularDependency = (graph: AsyncGraph) =>
        graph
          .addNode({
            id: 'A',
            run: Promise.resolve,
            dependencies: ['0', 'B'],
          })
          .addNode({
            id: 'C',
            run: Promise.resolve,
            dependencies: ['0', 'A'],
          })
          .addNode({
            id: 'B',
            run: Promise.resolve,
            dependencies: ['0', 'C'],
          })
          .addNode({
            id: '0',
            run: Promise.resolve,
          });

      expect(() =>
        populateGraphWithCircularDependency(new AsyncGraph()),
      ).to.throw(
        Error,
        `Adding async node with id: 'B' creates circular dependency`,
      );
    });
  });

  describe('resolve graph', () => {
    it('should throw an exception when detecting non-exsitent dependency reference', () => {
      const graph = new AsyncGraph();

      graph.addNode({
        id: 'id1',
        run: Promise.resolve,
        dependencies: ['id2'],
      });

      expect(graph.resolve).to.throw(
        Error,
        `Dependency with id: 'id2' doesn't exist`,
      );
    });
  });
});
