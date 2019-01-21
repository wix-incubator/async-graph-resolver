import { AsyncGraph } from '../src';
import { expect } from 'chai';

describe('multiple resolving', () => {
  it('should return cached result in case of multiple resolving', async () => {
    const graph = new AsyncGraph();
    let nodeRunsCounter = 0;
    let backendAsyncResult = 'First Result';

    graph.addNode({
      id: 'id1',
      run: () => {
        nodeRunsCounter++;
        return Promise.resolve(backendAsyncResult);
      },
    });

    const firstResult = await graph.resolve();

    backendAsyncResult = 'Second Result';
    const secondResult = await graph.resolve();

    expect(nodeRunsCounter).to.eq(1);
    expect(firstResult).to.deep.eq({
      id1: 'First Result',
    });
    expect(secondResult).to.deep.eq({
      id1: 'First Result',
    });
  });
});
