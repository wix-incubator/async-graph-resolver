export const DuplicateNodeIdError = node =>
  new Error(`Async node with id: '${node.id}' alredy exists`);

export const CircularDependencyError = node =>
  new Error(
    `Adding async node with id: '${node.id}' creates circular dependency`,
  );
