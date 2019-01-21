import { AsyncGraph } from '../src';
import { expect } from 'chai';

describe('builder error handling', () => {
  it('should throw an error when trying to add a node with existing id', () => {
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

  it('should throw an error when trying to add a node that creates circular dependency to itself', () => {
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

  it('should throw an error when trying to add a node that creates circular dependency', () => {
    const addNonUniqueNodes = (graph: AsyncGraph) =>
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

    expect(() => addNonUniqueNodes(new AsyncGraph())).to.throw(
      Error,
      `Adding async node with id: 'B' creates circular dependency`,
    );
  });
});
