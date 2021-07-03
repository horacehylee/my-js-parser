import test from "tape";
import { Parser, ParseResult } from "../src/parser";
import { json } from "../src/json";

interface Case<T> {
  input: string;
  parser: Parser<T>;
  expected: ParseResult<T>[] | ((input: string) => ParseResult<T>[]);
}

type Cases<T> = Record<string, Case<T>>;

const cases: Cases<unknown> = {
  "natural number": {
    input: "1234",
    parser: json.number,
    expected: [{ value: 1234, remainder: "" }],
  },
  "zero number": {
    input: "0000",
    parser: json.number,
    expected: [{ value: 0, remainder: "000" }],
  },
  "negative number": {
    input: "-1234",
    parser: json.number,
    expected: [{ value: -1234, remainder: "" }],
  },
  "fraction number": {
    input: "-0.34",
    parser: json.number,
    expected: [{ value: -0.34, remainder: "" }],
  },
  "fraction number invalid without 0": {
    input: "-.34",
    parser: json.number,
    expected: [],
  },
  "fraction number with non zero": {
    input: "1234.56",
    parser: json.number,
    expected: [{ value: 1234.56, remainder: "" }],
  },
  "fraction number zero": {
    input: "0.000",
    parser: json.number,
    expected: [{ value: 0, remainder: "" }],
  },
  "number with negative exponent": {
    input: "12E-5",
    parser: json.number,
    expected: [{ value: 12e-5, remainder: "" }],
  },
  "number with positive exponent": {
    input: "12e+55",
    parser: json.number,
    expected: [{ value: 12e55, remainder: "" }],
  },
  "expontent number zero": {
    input: "0.00e5",
    parser: json.number,
    expected: [{ value: 0, remainder: "" }],
  },
  "number with invalid expontent": {
    input: "12e",
    parser: json.number,
    expected: [],
  },
  whitespace: {
    input: "     ",
    parser: json.whitespace,
    expected: [{ value: "     ", remainder: "" }],
  },
  newline: {
    input: `
    `,
    parser: json.whitespace,
    expected: [
      {
        value: `
    `,
        remainder: "",
      },
    ],
  },
  string: {
    input: '"he ll o 123;!@#$  "',
    parser: json.string,
    expected: [{ value: "he ll o 123;!@#$  ", remainder: "" }],
  },
  "string without quote": {
    input: '"he ll o 123;!@#$  ',
    parser: json.string,
    expected: [],
  },
  "string without quotes": {
    input: "he ll o 123;!@#$  ",
    parser: json.string,
    expected: [],
  },
  "string with escape": {
    input: '"0/1\\/2\\"3\\\\4\\b5\\f6\\n7\\r8\\t9"',
    parser: json.string,
    expected: [
      {
        value: '0/1/2"3\\4\b5\f6\n7\r8\t9',
        remainder: "",
      },
    ],
  },
  "string with outside quote": {
    input: '"1234"zxc',
    parser: json.string,
    expected: [
      {
        value: "1234",
        remainder: "zxc",
      },
    ],
  },
  "string with invalid escape": {
    input: '"123\\a123"',
    parser: json.string,
    expected: [],
  },
  "string with unicode": {
    input: '"123\\u1234\\u00e9"',
    parser: json.string,
    expected: [
      {
        value: "123\u1234\u00e9",
        remainder: "",
      },
    ],
  },
  "string with emoji": {
    input:
      '"\\uD83D\\uDC69 + \\u200D\\u2764\\uFE0F\\u200D + \\uD83D\\uDC69 = \\uD83D\\uDC69\\u200D\\u2764\\uFE0F\\u200D\\uD83D\\uDC69"',
    parser: json.string,
    expected: [
      {
        value: "👩 + ‍❤️‍ + 👩 = 👩‍❤️‍👩",
        remainder: "",
      },
    ],
  },
  "string with invalid unicode": {
    input: '"123\\u"',
    parser: json.string,
    expected: [],
  },
  "string with invalid unicode with 1 number": {
    input: '"123\\u1"',
    parser: json.string,
    expected: [],
  },
  "string with invalid unicode with 2 number": {
    input: '"123\\u12"',
    parser: json.string,
    expected: [],
  },
  "string with invalid unicode with 3 number": {
    input: '"123\\u123"',
    parser: json.string,
    expected: [],
  },
  array: {
    input: '[1,  2,3  ,"4 " ]',
    parser: json.array,
    expected: [{ value: [1, 2, 3, "4 "], remainder: "" }],
  },
  "empty array": {
    input: "[   ]",
    parser: json.array,
    expected: [{ value: [], remainder: "" }],
  },
  "array with single item": {
    input: "[  1  ]",
    parser: json.array,
    expected: [{ value: [1], remainder: "" }],
  },
  "nested array": {
    input: '[1,[2,3], [" 4", [5]]]',
    parser: json.array,
    expected: [{ value: [1, [2, 3], [" 4", [5]]], remainder: "" }],
  },
  object: {
    input: '{"test": 123}',
    parser: json.object,
    expected: [{ value: { test: 123 }, remainder: "" }],
  },
  "empty object": {
    input: "{   }",
    parser: json.object,
    expected: [{ value: {}, remainder: "" }],
  },
  complex: {
    input: `{
      "id": "a thing\\nice\\tab",
      "another property!"
        : "also cool"
      , "weird formatting is ok too........😂": 123.45e1,
      "": [
        true, false, null,
        "",
        " ",
        {},
        {"": {}}
      ]
    }`,
    parser: json.value,
    expected: (input) => [{ value: JSON.parse(input), remainder: "" }],
  },
};

for (const [caseName, { input, parser, expected }] of Object.entries(cases)) {
  test(caseName, (t) => {
    const actual = parser.parse(input);
    if (typeof expected === "function") {
      t.deepEquals(actual, expected(input));
    } else {
      t.deepEquals(actual, expected);
    }
    t.end();
  });
}
