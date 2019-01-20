import { expect } from 'chai';
import { AsyncGraph } from '../src';

describe('AsyncGraphResolver', () => {
  it('should return non-aggregated data as an id -> value map', async () => {
    const graph = new AsyncGraph();

    graph.addNode({
      id: 'id1',
      run: () => Promise.resolve(1),
    });
    expect(await graph.resolve()).to.deep.equal({
      id1: 1,
    });
  });

  it('should return non-aggregated data as an id -> value map when there is a dependency', async () => {
    const graph = new AsyncGraph();

    graph
      .addNode({
        id: 'id1',
        run: () => Promise.resolve(1),
      })
      .addNode({
        id: 'someId',
        run: ({ id1 }) => Promise.resolve(id1 + 999),
        dependencies: ['id1'],
      });
    expect(await graph.resolve()).to.deep.equal({
      id1: 1,
      someId: 1000,
    });
  });
});
