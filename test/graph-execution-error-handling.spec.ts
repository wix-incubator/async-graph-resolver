import { AsyncGraph } from '../src';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';

before(() => {
  chai.should();
  chai.use(chaiAsPromised);
});

const expect = chai.expect;

const sleep = time => new Promise(resolve => setTimeout(resolve, time));

describe('error handling', () => {
  describe('default error handling strategy: fail if any node execution fails', () => {
    it('should reject promise with error returned by first rejected promise', () => {
      return new AsyncGraph()
        .addNode({
          id: 'id1',
          run: () => Promise.resolve(1),
        })
        .addNode({
          id: 'id2',
          run: () => Promise.reject(new Error('id2')),
        })
        .addNode({
          id: 'id3',
          run: () => Promise.resolve(2),
          dependencies: ['id2'],
        })
        .addNode({
          id: 'id4',
          run: () => Promise.reject(new Error('id4')),
          dependencies: ['id3'],
        })
        .addNode({
          id: 'id5',
          run: () => Promise.resolve(5),
          dependencies: ['id1'],
        })
        .resolve()
        .should.be.rejectedWith(Error, 'id2');
    });

    it('should stop promise execution in when error is encountered', async () => {
      const executionStack = [];
      try {
        await new AsyncGraph()
          .addNode({
            id: 'id1',
            run: () => {
              executionStack.push('id1');
              return new Promise(resolve => setTimeout(resolve, 100));
            },
          })
          .addNode({
            id: 'id2',
            run: () => {
              executionStack.push('id2');
              return Promise.reject(new Error('id2'));
            },
          })
          .addNode({
            id: 'id3',
            run: () => {
              executionStack.push('id3');
              return Promise.resolve('id3');
            },
            dependencies: ['id2'],
          })
          .addNode({
            id: 'id4',
            run: () => {
              executionStack.push('id4');
              return Promise.resolve('id3');
            },
            dependencies: ['id3'],
          })
          .addNode({
            id: 'id5',
            run: () => {
              executionStack.push('id5');
              return Promise.resolve('id5');
            },
            dependencies: ['id1'],
          })
          .resolve();
      } catch (err) {
        await sleep(200);
        expect(executionStack).to.deep.equal(['id1', 'id2']);
        return Promise.resolve();
      }

      return Promise.reject(
        new Error(
          'should have returned rejected promise from `AsyncGraph.resolve()`',
        ),
      );
    });
  });
});
