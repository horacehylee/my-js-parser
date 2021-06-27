// <JSON>     ::= <value>
// <value>    ::= <object> | <array> | <boolean> | <string> | <number> | <null>
// <array>    ::= "[" [<value>] {"," <value>}* "]"
// <object>   ::= "{" [<property>] {"," <property>}* "}"
// <property> ::= <string> ":" <value>

// interface JString {
//   currentIndex: number;
//   str: {
//     value: string;
//   };
// }

type JString = string;

export interface ParseResult<T> {
  value: T;
  remainder: JString;
}

type Parser<T> = (str: JString) => [ParseResult<T>] | [];

function parseLiteral(literal: string): Parser<string> {
  return (jStr) => {
    if (jStr.startsWith(literal)) {
      return [{ value: literal, remainder: jStr.slice(literal.length) }];
    }
    return [];
  };
}

export const parseNumber: Parser<number> = (str) => {
  let number = "";
  let idx = 0;
  let c = str.charAt(idx);

  function next() {
    idx++;
    c = str.charAt(idx);
  }

  function getDigits() {
    while (c && c >= "0" && c <= "9") {
      number += c;
      next();
    }
  }

  // negative number
  if (c === "-") {
    number += c;
    next();
  }

  // positive number
  getDigits();

  // decimal number
  if (c === ".") {
    number += c;
    next();
    getDigits();
  }

  // exponential number
  if (c === "e" || c === "E") {
    number += c;
    next();

    // @ts-expect-error
    if (c === "+" || c === "-") {
      number += c;
      next();
    }

    getDigits();
  }

  const num = Number(number);
  if (isNaN(num)) {
    return [];
  }
  return [{ value: num, remainder: str.slice(idx) }];
};

export const parseString: Parser<string> = (str) => {
  let s = "";
  let idx = 0;
  let c = str.charAt(idx);

  function next() {
    idx++;
    c = str.charAt(idx);
  }

  function getChars(): boolean {
    while (c && c !== '"') {
      if (c !== "\\") {
        s += c;
        next();
        continue;
      }

      next();
      switch (c) {
        //@ts-expect-error
        case '"':
        case "\\":
        //@ts-expect-error
        case "b":
        //@ts-expect-error
        case "f":
        //@ts-expect-error
        case "n":
        //@ts-expect-error
        case "r":
        //@ts-expect-error
        case "t":
          s += "\\";
        //@ts-expect-error
        case "/":
          s += c; // not need to add "\"
          next();
          break;
        //@ts-expect-error
        case "u":
          let s2 = "";
          next();
          for (let i = 0; i < 4; i++) {
            if (
              !(
                c &&
                ((c >= "0" && c <= "9") ||
                  (c >= "a" && c <= "f") ||
                  (c >= "A" && c <= "F"))
              )
            ) {
              return false;
            }
            s2 += c;
            next();
          }
          s += String.fromCharCode(parseInt(s2, 16));
          break;
        default:
          return false;
      }
    }
    return true;
  }

  // TODO: extract this to parseLiteral
  if (c !== '"') {
    return [];
  }
  next();

  const valid = getChars();
  if (!valid) {
    return [];
  }

  // TODO: extract this to parseLiteral
  if (c !== '"') {
    return [];
  }
  next();

  return [{ value: s, remainder: str.slice(idx) }];
};
