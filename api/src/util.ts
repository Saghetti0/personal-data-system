/// A function that throws an error.
/// Useful in conjunction with the nullish coalescing operator.
export function complain(message: string): never {
  throw new Error(message);
}
