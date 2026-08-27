/**
 * Native JSON.parse converts every JSON number to a JavaScript number before
 * response validation can inspect it. Backend BigDecimal values can therefore
 * lose precision in transit. This scanner quotes JSON number tokens while
 * leaving numbers inside JSON strings untouched.
 */
export function parseJsonPreservingNumbers(source: string): unknown {
  let output = "";
  let index = 0;
  let inString = false;
  let escaped = false;

  while (index < source.length) {
    const character = source[index]!;

    if (inString) {
      output += character;
      if (escaped) {
        escaped = false;
      } else if (character === "\\") {
        escaped = true;
      } else if (character === '"') {
        inString = false;
      }
      index += 1;
      continue;
    }

    if (character === '"') {
      inString = true;
      output += character;
      index += 1;
      continue;
    }

    if (character === "-" || (character >= "0" && character <= "9")) {
      const numberToken = source
        .slice(index)
        .match(/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/u)?.[0];

      if (numberToken) {
        output += JSON.stringify(numberToken);
        index += numberToken.length;
        continue;
      }
    }

    output += character;
    index += 1;
  }

  return JSON.parse(output) as unknown;
}
