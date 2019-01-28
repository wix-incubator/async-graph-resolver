import { AsyncGraph } from '../../src';

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

    expect(invokingAndResolvingOrder).toEqual([
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
