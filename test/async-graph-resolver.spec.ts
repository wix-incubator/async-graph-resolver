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
        run: ({ id1 }) => Promise.resolve((id1 as number) + 999),
        dependencies: ['id1'],
      });
    expect(await graph.resolve()).to.deep.equal({
      id1: 1,
      someId: 1000,
    });
  });

  it('should return non-aggregated data as an id -> value map when there is a dependency', async () => {
    const graph = new AsyncGraph();

    graph
      .addNode({
        id: 'id1',
        run: () => Promise.resolve(0),
      })
      .addNode({
        id: 'someId1',
        run: ({ id1 }) => Promise.resolve((id1 as number) + 1),
        dependencies: ['id1'],
      })
      .addNode({
        id: 'someId2',
        run: ({ id1 }) => Promise.resolve((id1 as number) + 2),
        dependencies: ['id1'],
      })
      .addNode({
        id: 'someId3',
        run: ({ someId1, someId2 }) => Promise.resolve(`${someId1},${someId2}`),
        dependencies: ['someId1', 'someId2'],
      });

    expect(await graph.resolve()).to.deep.equal({
      id1: 0,
      someId1: 1,
      someId2: 2,
      someId3: '1,2',
    });
  });
});
