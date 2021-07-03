import { json } from "./json";

export function parseJson(str: string): unknown {
  const results = json.value.parse(str);
  if (!results) {
    throw new Error("Failed to parse JSON");
  }
  const result = results[0];
  if (result.remainder.length) {
    throw new Error(
      `Failed to parse JSON, as there is remainder: ${result.remainder}`
    );
  }
  return result.value;
}
