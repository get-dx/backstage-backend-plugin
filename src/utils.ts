export function chunk(array: any[], size = 1) {
  if (!array.length || size < 1) {
    return [];
  }

  const chunked = [];

  for (let i = 0; i < array.length; i += size) {
    chunked.push(array.slice(i, i + size));
  }

  return chunked;
}
