# async-graph-resolver
A utility to handle execution and aggregation of async actions.

## Introduction

Using node.js as a rendering server might involve multiple async actions(REST or RPC calls), some might be dependant on another, some might run in parallel.

Coding the flow to handle it efficiently might be hard and ugly, and might require heavy thinking each time we want to change this flow.

AGR is aiming to simplify the way to describe the actions graph, and resolve it in the most efficient way.

## Usage

### Install

### API

### Examples
```javascript
import { AsyncGraph } from 'async-graph-resolver';

const customerId = '123';

const relevantRestaurantsGraph = new AsyncGraph()
  .addNode({
    id: 'customerPreferences',
    run: () => getCustomerPreferences(customerId)
  })
  .addNode({
    id: 'customerLocation',
    run: () => getCustomerLocation(customerId)
  })
  .addNode({
    id: 'availableRestaurants',
    run: ({customerPreferences, customerLocation}) => getAvailableRestaurants(customerPreferences, customerLocation),
    dependancies: ['customerPreferences', 'customerLocation']
  })
  .addNode({
    id: 'customerFriends',
    run: () => getCusomterFriends(customerId)
  })
  .addNode({
    id: 'recommendedRestaurants',
    run: ({customerFriends, availableRestaurants}) => getRelevantRestaurants(customerFriends, availableRestaurants),
    dependancies: ['customerFriends', 'availableRestaurants']
  })
  .useFormatter(({recommendedRestaurants}) => ({
    relevantResturants: recommendedRestaurants
  });

const result = await relevantRestaurantsGraph.resolve();
```
