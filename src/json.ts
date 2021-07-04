import {
  check,
  digits,
  fail,
  first,
  join,
  joinP,
  lazy,
  lift,
  literal,
  Parser,
  pipe,
  regex,
} from "./parser";

export const json: Record<string, Parser<any>> = {
  number: lazy(() => {
    const oneToNine: Parser<string> = check((c) => c >= "1" && c <= "9");
    const zero: Parser<string> = check((c) => c === "0");

    const exponent: Parser<string> = joinP(
      [
        first([literal("e"), literal("E")]),
        first([literal("+"), literal("-"), lift("")]),
        digits,
      ],
      ""
    );

    const fraction: Parser<string> = joinP([literal("."), digits], "");

    const toNumber = (str: string): Parser<number> => {
      if (!str.length) {
        return fail();
      }
      const num = Number(str);
      if (isNaN(num)) {
        return fail();
      }
      return lift(num);
    };

    return joinP(
      [
        first([literal("-"), lift("")]),
        first([zero, joinP([oneToNine, digits], "")]),
        first([fraction, lift("")]),
        first([exponent, lift("")]),
      ],
      ""
    ).chain(toNumber);
  }),

  whitespace: lazy(() => regex(/\s*/)),

  string: lazy(() => {
    const nonControlChars: Parser<string> = regex(/^[^\\\"]+/);

    const solidus: Parser<string> = first([literal("/"), literal("\\/")]).map(
      () => "/"
    );
    const escapeTypes: any = {
      b: "\b",
      f: "\f",
      n: "\n",
      r: "\r",
      t: "\t",
    };
    const escapes: Parser<string> = pipe<string>([
      literal("\\"),
      first([
        literal('"'),
        literal("\\"),
        literal("b"),
        literal("f"),
        literal("n"),
        literal("r"),
        literal("t"),
      ]),
    ])(([, type]) => {
      if (escapeTypes[type]) {
        return lift(escapeTypes[type]);
      }
      return lift(type);
    });

    const fourHexDigits = regex(/[0-9a-f]{4}/i);
    const unicode: Parser<string> = pipe<string>([
      literal("\\u"),
      fourHexDigits,
    ])(([, ds]) => lift(String.fromCharCode(parseInt(ds, 16))));

    const nonEmptyString: Parser<string> = pipe<string>([
      literal('"'),
      join(first([nonControlChars, solidus, escapes, unicode]).some(), ""),
      literal('"'),
    ])(([, str]) => lift(str));

    const emptyString: Parser<string> = pipe<string>([
      literal('"'),
      literal('"'),
    ])(() => lift(""));

    return first([emptyString, nonEmptyString]);
  }),

  true: literal("true").map(() => true),
  false: literal("false").map(() => false),
  null: literal("null").map(() => null),

  value: lazy(() => {
    return pipe<any>([
      json.whitespace,
      first<any>([
        json.string,
        json.number,
        json.array,
        json.object,
        json.true,
        json.false,
        json.null,
      ]),
      json.whitespace,
    ])(([, v]) => lift(v));
  }),

  array: lazy(() => {
    const leftBracket = literal("[");
    const rightBracket = literal("[");

    const emptyArray: Parser<any[]> = pipe<any[]>([
      leftBracket,
      json.whitespace,
      rightBracket,
    ])(() => lift([]));

    const nonEmptyArray: Parser<any[]> = pipe<any[]>([
      leftBracket,
      pipe<any[]>([json.value, first([literal(","), lift("")])])(([v]) =>
        lift(v)
      ).some(),
      rightBracket,
    ])(([, arr]) => lift(arr));

    return first([emptyArray, nonEmptyArray]);
  }),

  object: lazy(() => {
    const leftBrace = literal("{");
    const rightBrace = literal("}");

    const emptyObject: Parser<Object> = pipe<Object>([
      leftBrace,
      json.whitespace,
      rightBrace,
    ])(() => lift({}));

    const pair: Parser<[string, any]> = pipe<[string, any]>([
      json.whitespace,
      json.string,
      json.whitespace,
      literal(":"),
      json.value,
    ])(([, key, , , value]) => {
      return lift([key, value]);
    });

    const nonEmptyObject: Parser<Object> = pipe<Object>([
      leftBrace,
      pipe<[string, any][]>([pair, first([literal(","), lift("")])])(([p]) =>
        lift(p)
      ).some(),
      rightBrace,
    ])(([, ps]) => {
      const pairs: [string, any][] = ps;
      const obj: any = {};
      for (const [key, value] of pairs) {
        obj[key] = value;
      }
      return lift(obj);
    });

    return first([emptyObject, nonEmptyObject]);
  }),
};
