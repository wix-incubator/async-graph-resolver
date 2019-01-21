import { AsyncGraph } from '../src';
import { expect } from 'chai';

describe('default formatter', () => {
  it('should resolve single node', async () => {
    const graph = new AsyncGraph();

    graph.addNode({
      id: 'id1',
      run: () => Promise.resolve(1),
    });
    expect(await graph.resolve()).to.deep.equal({
      id1: 1,
    });
  });

  it('should resovle 2 dependant nodes', async () => {
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

  it('should resolve rhombus shaped dependacies graph ', async () => {
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

  it('should resolve a complex graph', async () => {
    const graph = new AsyncGraph();

    graph
      .addNode({
        id: 'id3',
        run: () => Promise.resolve(3),
      })
      .addNode({
        id: 'id5',
        run: () => Promise.resolve(5),
      })
      .addNode({
        id: 'id7',
        run: () => Promise.resolve(7),
      })
      .addNode({
        id: 'id3_5',
        run: ({ id3, id5 }) => Promise.resolve(id3 * id5),
        dependencies: ['id3', 'id5'],
      })
      .addNode({
        id: 'id5_7',
        run: ({ id5, id7 }) => Promise.resolve(id5 * id7),
        dependencies: ['id5', 'id7'],
      })
      .addNode({
        id: 'id3_5_7',
        run: ({ id3, id5_7 }) => Promise.resolve(id3 * id5_7),
        dependencies: ['id3', 'id5_7'],
      });

    expect(await graph.resolve()).to.deep.equal({
      id3: 3,
      id5: 5,
      id7: 7,
      id3_5: 15,
      id5_7: 35,
      id3_5_7: 105,
    });
  });
});
