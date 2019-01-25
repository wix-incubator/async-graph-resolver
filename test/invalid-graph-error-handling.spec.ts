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
        `Dependency with id(s): ['id2'] do not exist`,
      );
    });

    it('should throw an error when circular dependency of node to itself detected', () => {
      const graph = new AsyncGraph();
      graph.addNode({
        id: 'A',
        run: Promise.resolve,
        dependencies: ['A'],
      });

      expect(graph.resolve).to.throw(
        Error,
        `A circular dependency path was detected: A -> A`,
      );
    });

    it('should throw an error when circular dependency detected', () => {
      const graph = new AsyncGraph();
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

      expect(graph.resolve).to.throw(
        Error,
        `A circular dependency path was detected: A -> C -> B -> A`,
      );
    });
  });
});
