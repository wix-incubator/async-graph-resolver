import { AsyncGraph } from '../src';
import { expect } from 'chai';

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
