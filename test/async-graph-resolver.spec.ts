import { expect } from 'chai';
import { AsyncGraph } from '../src';

describe('AsyncGraphResolver', () => {
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
          run: ({ someId1, someId2 }) =>
            Promise.resolve(`${someId1},${someId2}`),
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

  describe('custom formatter', () => {
    it('should format result with custom formatter', async () => {
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
        })
        .useFormatter(({ id3_5_7 }) => ({
          data: {
            id3_5_7,
          },
        }));

      expect(await graph.resolve()).to.deep.equal({
        data: {
          id3_5_7: 105,
        },
      });
    });
  });

  describe('resolving efficiency', () => {
    it('should resolve the graph in the most efficient order', async () => {
      const graph = new AsyncGraph();
      const invokingAndResolvingOrder = [];

      graph
        .addNode({
          id: 'id1',
          run: () => {
            invokingAndResolvingOrder.push('invoking id1');
            return new Promise(resolve => {
              setTimeout(() => {
                invokingAndResolvingOrder.push('resolving id1');
                resolve();
              }, 0);
            });
          },
        })
        .addNode({
          id: 'id2',
          run: () => {
            invokingAndResolvingOrder.push('invoking id2');
            return new Promise(resolve => {
              setTimeout(() => {
                invokingAndResolvingOrder.push('resolving id2');
                resolve();
              }, 200);
            });
          },
        })
        .addNode({
          id: 'id3',
          run: () => {
            invokingAndResolvingOrder.push('invoking id3');
            return new Promise(resolve => {
              setTimeout(() => {
                invokingAndResolvingOrder.push('resolving id3');
                resolve();
              }, 0);
            });
          },
          dependencies: ['id1'],
        })
        .addNode({
          id: 'id4',
          run: () => {
            invokingAndResolvingOrder.push('invoking id4');
            return new Promise(resolve => {
              setTimeout(() => {
                invokingAndResolvingOrder.push('resolving id4');
                resolve();
              }, 0);
            });
          },
          dependencies: ['id1', 'id2'],
        });

      await graph.resolve();

      expect(invokingAndResolvingOrder).to.deep.equal([
        'invoking id1',
        'invoking id2',
        'resolving id1',
        'invoking id3',
        'resolving id3',
        'resolving id2',
        'invoking id4',
        'resolving id4',
      ]);
    });
  });

  describe('multiple resolving', () => {
    it('should enable graph multiple times', async () => {
      const graph = new AsyncGraph();

      let backendResourceState = 1;

      graph.addNode({
        id: 'id1',
        run: () => Promise.resolve(backendResourceState),
      });

      const firstResult = await graph.resolve();

      backendResourceState = 2;

      const secondResult = await graph.resolve();

      expect({ firstResult, secondResult }).to.deep.eq({
        firstResult: {
          id1: 1,
        },
        secondResult: {
          id1: 2,
        },
      });
    });
  });
});
