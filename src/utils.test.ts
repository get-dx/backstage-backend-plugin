import { chunk } from "./utils";

describe("chunk", () => {
  test.each([
    {
      input: [1, 2, 3, 4, 5, 6],
      size: 2,
      expected: [
        [1, 2],
        [3, 4],
        [5, 6],
      ],
    },
  ])("chunk($input, $size)", ({ input, size, expected }) => {
    expect(chunk(input, size)).toEqual<Array<number>[]>(expected);
  });
});
