export function memoize<T extends Function>(fn: T): T {
  const cache: Record<string, any> = {};

  return function () {
    const n = arguments;
    const k = JSON.stringify(n);

    if (cache[k] != undefined) {
      return cache[k];
    }

    const result = fn.call(n);
    cache[k] = result;

    return result;
  } as any;
}
