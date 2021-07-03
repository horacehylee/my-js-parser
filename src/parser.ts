// Monad approach for parser

// type Parser a = String -> [(a, String)]

export interface ParseResult<T> {
  value: T;
  remainder: string;
}

type ParsingFunction<T> = (str: string) => ParseResult<T>[];

export interface Parser<T> {
  parse: ParsingFunction<T>;
  chain: <T2>(chainFunc: (result: T) => Parser<T2>) => Parser<T2>;
  map: <T2>(mapFunc: (result: T) => T2) => Parser<T2>;
  many: () => Parser<T[]>;
  some: () => Parser<T[]>;
}

export const parser = <T>(func: ParsingFunction<T>): Parser<T> => {
  function chain<T2>(chainFunc: (result: T) => Parser<T2>): Parser<T2> {
    return parser((str) => {
      const results = func(str);
      if (!results.length) {
        return [];
      }
      const parsers = results.map((res) => chainFunc(res.value));
      return results.flatMap((res) => [
        ...parsers.flatMap((p) => {
          return p.parse(res.remainder);
        }),
      ]);
    });
  }

  function map<T2>(mapFunc: (result: T) => T2): Parser<T2> {
    return parser((str) => {
      const results = func(str);
      return results.map((res) => ({
        value: mapFunc(res.value),
        remainder: res.remainder,
      }));
    });
  }

  function many(): Parser<T[]> {
    return parser((str) => {
      const results: ParseResult<T>[] = [];

      let leftOverStr = str;
      let leftOverResults: ParseResult<T>[] = [];
      do {
        leftOverResults = func(leftOverStr);
        if (leftOverResults.length) {
          // Assume only 1 ParseResult<T>, in future can think of enhancing to handle multiple results
          const leftOverResult = leftOverResults[0];
          results.push(leftOverResult);
          leftOverStr = leftOverResult.remainder;
        }
      } while (leftOverResults.length);

      return [{ value: results.map((r) => r.value), remainder: leftOverStr }];
    });
  }

  function some(): Parser<T[]> {
    return many().chain((result) => {
      if (!result.length) {
        return fail();
      }
      return lift(result);
    });
  }

  return {
    // TODO: more user friendly parse function
    parse: func,
    chain,
    map,
    many,
    some,
  };
};

export const lift = <T>(value: T) =>
  parser((str) => [{ value, remainder: str }]);

export const fail = (): Parser<any> => parser(() => []);

export const lazy = <T>(func: () => Parser<T>): Parser<T> => {
  let initialized = false;
  let instance: Parser<T> = parser(() => {
    throw new Error("lazy instance is not initialized");
  });
  return parser((str) => {
    if (!initialized) {
      instance = func();
      initialized = true;
    }
    return instance.parse(str);
  });
};

// pipe
export function pipe<T0, T1, R>(
  parsers: [Parser<T0>, Parser<T1>]
): (func: (args: [T0, T1]) => Parser<R>) => Parser<R>;
export function pipe<T0, T1, T2, R>(
  parsers: [Parser<T0>, Parser<T1>, Parser<T2>]
): (func: (args: [T0, T1, T2]) => Parser<R>) => Parser<R>;
export function pipe<T0, T1, T2, T3, R>(
  parsers: [Parser<T0>, Parser<T1>, Parser<T2>, Parser<T3>]
): (func: (args: [T0, T1, T2, T3]) => Parser<R>) => Parser<R>;
export function pipe<R>(
  parsers: Parser<any>[]
): (func: (args: any[]) => Parser<R>) => Parser<R>;
export function pipe<R>(
  parsers: Parser<unknown>[]
): (func: (args: unknown[]) => Parser<R>) => Parser<R> {
  return (func) => {
    let i = 0;
    let resP = parsers[i++].chain((res) => lift([res]));
    for (; i < parsers.length; i++) {
      const p = parsers[i];
      resP = resP.chain((arr) => {
        return p.chain((res) => lift([...arr, res])); // push every result to the array
      });
    }
    return resP.chain((arr) => {
      return func(arr);
    });
  };
}

export function first<T>(parsers: Parser<T>[]): Parser<T> {
  if (!parsers.length) {
    return fail();
  }
  return parser((str) => {
    for (const p of parsers) {
      const results = p.parse(str);
      if (!results.length) {
        continue;
      }
      return results;
    }
    return [];
  });
}

export function join<T>(
  parser: Parser<T[]>,
  separator: string = ","
): Parser<string> {
  return parser.map((results) => results.join(separator));
}

export function joinP(
  parsers: Parser<unknown>[],
  separator: string = ","
): Parser<string> {
  if (!parsers.length) {
    return lift("");
  }
  //@ts-ignore
  return pipe(parsers)((args) => {
    return lift(args.join(separator));
  });
}

// ===========
// Derived
// ===========

export const oneChar = parser((str) =>
  str.length ? [{ value: str.charAt(0), remainder: str.slice(1) }] : []
);

export const check = (predicate: (char: string) => boolean): Parser<string> =>
  oneChar.chain((c) => {
    if (predicate(c)) {
      return lift(c);
    }
    return fail();
  });

export const char = (char: string): Parser<string> => check((c) => c === char);

export const literal = (literal: string) => {
  return parser((str) => {
    return str && str.startsWith(literal)
      ? [{ value: literal, remainder: str.slice(literal.length) }]
      : [];
  });
};

export const regex = (regExp: RegExp, group: number = 0): Parser<string> => {
  return parser((str) => {
    const match = regExp.exec(str);
    if (!match || group > match.length) {
      return [];
    }
    const fullMatch = match[0];
    const groupMatch = match[group];
    return [
      {
        value: groupMatch,
        remainder: str.slice(str.indexOf(fullMatch) + fullMatch.length),
      },
    ];
  });
};

// Monadic approach
// export const digit: Parser<string> = check((c) => c >= "0" && c <= "9");
// export const digits: Parser<string> = digit
//   .many()
//   .chain((ds) => lift(ds.join("")));

export const digit: Parser<string> = regex(/^[0-9]/);
export const digits: Parser<string> = regex(/^[0-9]*/);

export const naturalNum: Parser<number> = digits.chain((ds) => {
  if (!ds.length) {
    return fail();
  }
  const num = Number(ds);
  if (isNaN(num)) {
    return fail();
  }
  return lift(num);
});

export const letter: Parser<string> = regex(/^[a-z]/i);
export const letters: Parser<string> = regex(/^[a-z]*/i);
