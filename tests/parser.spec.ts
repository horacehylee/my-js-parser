import test from "tape";
import { ParseResult } from "../src/parser";
import {
  oneChar,
  lift,
  char,
  literal,
  naturalNum,
  digit,
  Parser,
  regex,
  pipe,
  letter,
  first,
  join,
  joinP,
} from "../src/parser";

interface Case<T> {
  input: string;
  parser: Parser<T>;
  expected: ParseResult<T>[];
}

type Cases<T> = Record<string, Case<T>>;

const cases: Cases<unknown> = {
  lift: {
    input: "",
    parser: lift(""),
    expected: [{ value: "", remainder: "" }],
  },
  oneChar: {
    input: "1234",
    parser: oneChar,
    expected: [{ value: "1", remainder: "234" }],
  },
  "oneChar with chain": {
    input: "1234",
    parser: oneChar.chain((c1) => oneChar.chain((c2) => lift(c1 + c2))),
    expected: [{ value: "12", remainder: "34" }],
  },
  "oneChar with chan without enough input": {
    input: "1",
    parser: oneChar.chain((c1) => oneChar.chain((c2) => lift(c1 + c2))),
    expected: [],
  },
  "chain with 3 or more": {
    input: "",
    parser: lift("1").chain((c1) =>
      lift("2").chain((c2) => lift("3").chain((c3) => lift(c1 + c2 + c3)))
    ),
    expected: [{ value: "123", remainder: "" }],
  },
  char: {
    input: "1234",
    parser: char("1"),
    expected: [{ value: "1", remainder: "234" }],
  },
  "char invalid": {
    input: "234",
    parser: char("1"),
    expected: [],
  },
  literal: {
    input: "1234",
    parser: literal("123"),
    expected: [{ value: "123", remainder: "4" }],
  },
  "literal not enough": {
    input: "12",
    parser: literal("123"),
    expected: [],
  },
  digit: {
    input: "1234",
    parser: digit,
    expected: [{ value: "1", remainder: "234" }],
  },
  many: {
    input: "1234",
    parser: digit.many(),
    expected: [{ value: ["1", "2", "3", "4"], remainder: "" }],
  },
  "many with interrupt": {
    input: "12a34",
    parser: digit.many(),
    expected: [{ value: ["1", "2"], remainder: "a34" }],
  },
  "many with empty": {
    input: "a1234",
    parser: digit.many(),
    expected: [{ value: [], remainder: "a1234" }],
  },
  some: {
    input: "1234",
    parser: digit.some(),
    expected: [{ value: ["1", "2", "3", "4"], remainder: "" }],
  },
  "some with interrupt": {
    input: "12a34",
    parser: digit.some(),
    expected: [{ value: ["1", "2"], remainder: "a34" }],
  },
  "some needs at least 1 match": {
    input: "a1234",
    parser: digit.some(),
    expected: [],
  },
  naturalNum: {
    input: "1234",
    parser: naturalNum,
    expected: [{ value: 1234, remainder: "" }],
  },
  "naturalNum ends early": {
    input: "12a34",
    parser: naturalNum,
    expected: [{ value: 12, remainder: "a34" }],
  },
  regex: {
    input: "12a34",
    parser: regex(/^[0-9]+/),
    expected: [{ value: "12", remainder: "a34" }],
  },
  "regex jump to match": {
    input: "a1234b",
    parser: regex(/[0-9]+/),
    expected: [{ value: "1234", remainder: "b" }],
  },
  "regex not match": {
    input: "a1234",
    parser: regex(/^[0-9]+/),
    expected: [],
  },
  "regex with group": {
    input: "12A34",
    parser: regex(/^[0-9]+([a-z])/i, 1),
    expected: [{ value: "A", remainder: "34" }],
  },
  "regex with group not match": {
    input: "12A34",
    parser: regex(/^[0-9]+([a-z])/, 1),
    expected: [],
  },
  pipe: {
    input: "1234",
    parser: pipe([digit, digit])(([x, y]) => lift(x + y)),
    expected: [{ value: "12", remainder: "34" }],
  },
  "pipe with many": {
    input: "123abcd",
    parser: pipe([digit.many(), letter.many()])(([x, y]) =>
      lift([...x, ...y].join(""))
    ),
    expected: [{ value: "123abcd", remainder: "" }],
  },
  "pipe not match": {
    input: "1a23",
    parser: pipe([digit, digit])(([x, y]) => lift(x + y)),
    expected: [],
  },
  "pipe with lift": {
    input: "",
    parser: pipe([lift("1"), lift("2"), lift("3")])(([x, y, z]) =>
      lift(x + y + z)
    ),
    expected: [{ value: "123", remainder: "" }],
  },
  first: {
    input: "1a23",
    parser: first([letter, digit, naturalNum.map((num) => num.toString())]),
    expected: [{ value: "1", remainder: "a23" }],
  },
  "first non match": {
    input: "a23",
    parser: first([digit, naturalNum.map((num) => num.toString())]),
    expected: [],
  },
  join: {
    input: "1234",
    parser: join(digit.some(), ""),
    expected: [{ value: "1234", remainder: "" }],
  },
  joinP: {
    input: "1234",
    parser: joinP([digit, digit, digit], ""),
    expected: [{ value: "123", remainder: "4" }],
  },
};

for (const [caseName, { input, parser, expected }] of Object.entries(cases)) {
  test(caseName, (t) => {
    const actual = parser.parse(input);
    t.deepEquals(actual, expected);
    t.end();
  });
}
