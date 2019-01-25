export const DuplicateNodeIdError = nodeId =>
  new Error(`Async node with id: '${nodeId}' alredy exists`);

export const CircularDependencyError = (circularPath: string[]) =>
  new Error(
    `A circular dependency path was detected: ${circularPath.join(' -> ')}`,
  );

export const InvalidDependenciesError = dependencyIds =>
  new Error(
    `Dependency with id(s): [${dependencyIds.map(
      id => `'${id}'`,
    )}] do not exist`,
  );
