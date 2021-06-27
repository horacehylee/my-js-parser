import test from "tape";
import { parseNumber, ParseResult, parseString } from "../src/parser";

type Case<T> = { input: string; result: [ParseResult<T>] | [] };
type Cases<T> = Record<string, Case<T>>;

test("parseNumber", (t) => {
  const cases: Cases<number> = {
    "valid number": {
      input: "1234",
      result: [
        {
          value: 1234,
          remainder: "",
        },
      ],
    },
    "valid negative number": {
      input: "-1234",
      result: [
        {
          value: -1234,
          remainder: "",
        },
      ],
    },
    "valid negative number with extra minus in middle": {
      input: "-1-23",
      result: [
        {
          value: -1,
          remainder: "-23",
        },
      ],
    },
    "valid decimal number": {
      input: "12.34",
      result: [
        {
          value: 12.34,
          remainder: "",
        },
      ],
    },
    "valid negative decimal number": {
      input: "-12.34",
      result: [
        {
          value: -12.34,
          remainder: "",
        },
      ],
    },
    "valid number with remainder": {
      input: "1234,",
      result: [
        {
          value: 1234,
          remainder: ",",
        },
      ],
    },
    "valid number with letter": {
      input: "12a34",
      result: [
        {
          value: 12,
          remainder: "a34",
        },
      ],
    },
    "valid number with exponential": {
      input: "12e34",
      result: [
        {
          value: 12e34,
          remainder: "",
        },
      ],
    },
    "valid number with positive exponential": {
      input: "12e+34",
      result: [
        {
          value: 12e34,
          remainder: "",
        },
      ],
    },
    "valid number with negative exponential": {
      input: "12e-34",
      result: [
        {
          value: 12e-34,
          remainder: "",
        },
      ],
    },
    "invalid negative number": {
      input: "--123",
      result: [],
    },
    "invalid number with invalid exponential": {
      input: "12e",
      result: [],
    },
  };

  for (const [caseName, caseObj] of Object.entries(cases)) {
    t.test(caseName, (t2) => {
      const result = parseNumber(caseObj.input);
      t2.deepEquals(result, caseObj.result);
      t2.end();
    });
  }
  t.end();
});

test("parseString", (t) => {
  const cases: Cases<string> = {
    "valid string": {
      input: '"1234"zxc',
      result: [
        {
          value: "1234",
          remainder: "zxc",
        },
      ],
    },
    "valid string with spaces": {
      input: '"12  34 ^!@#$"',
      result: [
        {
          value: "12  34 ^!@#$",
          remainder: "",
        },
      ],
    },
    "valid string with escape": {
      input: '"0/1\\/2\\"3\\\\4\\b5\\f6\\n7\\r8\\t9"',
      result: [
        {
          value: '0/1/2\\"3\\\\4\\b5\\f6\\n7\\r8\\t9',
          remainder: "",
        },
      ],
    },
    "valid string with unicode": {
      input: '"123\\u1234\\u00e9"',
      result: [
        {
          value: "123\u1234\u00e9",
          remainder: "",
        },
      ],
    },
    "valid string with emoji": {
      input:
        '"\\uD83D\\uDC69 + \\u200D\\u2764\\uFE0F\\u200D + \\uD83D\\uDC69 = \\uD83D\\uDC69\\u200D\\u2764\\uFE0F\\u200D\\uD83D\\uDC69"',
      result: [
        {
          value: "👩 + ‍❤️‍ + 👩 = 👩‍❤️‍👩",
          remainder: "",
        },
      ],
    },
    "invalid string with invalid escape": {
      input: '"123\\a123"',
      result: [],
    },
    "invalid string with invalid unicode": {
      input: '"123\\u"',
      result: [],
    },
    "invalid string with invalid unicode with 1 number": {
      input: '"123\\u1"',
      result: [],
    },
    "invalid string with invalid unicode with 2 number": {
      input: '"123\\u12"',
      result: [],
    },
    "invalid string with invalid unicode with 3 number": {
      input: '"123\\u123"',
      result: [],
    },
  };

  for (const [caseName, caseObj] of Object.entries(cases)) {
    t.test(caseName, (t2) => {
      const result = parseString(caseObj.input);
      t2.deepEquals(result, caseObj.result);
      t2.end();
    });
  }
  t.end();
});
