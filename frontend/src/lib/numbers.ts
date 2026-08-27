import type { Decimal } from "@/lib/api/types";

const integerFormatter = new Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 0,
});

interface DecimalParts {
  negative: boolean;
  integer: string;
  fraction: string;
}

function parseDecimal(value: Decimal, exponentShift = 0): DecimalParts | null {
  const match = value
    .trim()
    .match(
      /^(-)?(0|[1-9]\d*)(?:\.(\d+))?(?:[eE]([+-]?\d+))?$/u,
    );
  if (!match) return null;

  const integerSource = match[2]!;
  const fractionSource = match[3] ?? "";
  const exponent = Number(match[4] ?? "0") + exponentShift;
  if (!Number.isSafeInteger(exponent)) return null;

  const digits = `${integerSource}${fractionSource}`;
  const decimalPosition = integerSource.length + exponent;
  let integer: string;
  let fraction: string;

  if (decimalPosition <= 0) {
    integer = "0";
    fraction = `${"0".repeat(-decimalPosition)}${digits}`;
  } else if (decimalPosition >= digits.length) {
    integer = `${digits}${"0".repeat(decimalPosition - digits.length)}`;
    fraction = "";
  } else {
    integer = digits.slice(0, decimalPosition);
    fraction = digits.slice(decimalPosition);
  }

  integer = integer.replace(/^0+(?=\d)/u, "");
  const isZero = !/[1-9]/u.test(`${integer}${fraction}`);
  return {
    negative: Boolean(match[1]) && !isZero,
    integer,
    fraction,
  };
}

function incrementDigits(value: string) {
  const digits = value.split("");
  for (let index = digits.length - 1; index >= 0; index -= 1) {
    const digit = Number(digits[index]);
    if (digit < 9) {
      digits[index] = String(digit + 1);
      return digits.join("");
    }
    digits[index] = "0";
  }
  return `1${digits.join("")}`;
}

function round(parts: DecimalParts, fractionDigits: number): DecimalParts {
  const keptFraction = parts.fraction
    .slice(0, fractionDigits)
    .padEnd(fractionDigits, "0");
  const nextDigit = parts.fraction[fractionDigits] ?? "0";
  if (nextDigit < "5") {
    return { ...parts, fraction: keptFraction };
  }

  const combined = incrementDigits(`${parts.integer}${keptFraction}`);
  const integerLength = combined.length - fractionDigits;
  return {
    ...parts,
    integer: combined.slice(0, integerLength) || "0",
    fraction:
      fractionDigits > 0 ? combined.slice(integerLength).padStart(fractionDigits, "0") : "",
  };
}

function groupIndianInteger(value: string) {
  if (value.length <= 3) return value;
  const finalThree = value.slice(-3);
  const leading = value.slice(0, -3);
  return `${leading.replace(/\B(?=(\d{2})+(?!\d))/gu, ",")},${finalThree}`;
}

export function formatInr(value: Decimal): string {
  const parsed = parseDecimal(value);
  if (!parsed) return "—";
  const rounded = round(parsed, 2);
  const sign = rounded.negative ? "-" : "";
  return `${sign}₹${groupIndianInteger(rounded.integer)}.${rounded.fraction}`;
}

export function formatInteger(value: number): string {
  return Number.isSafeInteger(value) ? integerFormatter.format(value) : "—";
}

export function formatQuantity(value: Decimal): string {
  const parsed = parseDecimal(value);
  if (!parsed) return "—";
  const meaningfulFraction = parsed.fraction.replace(/0+$/u, "");
  const sign = parsed.negative ? "-" : "";
  return meaningfulFraction
    ? `${sign}${groupIndianInteger(parsed.integer)}.${meaningfulFraction}`
    : `${sign}${groupIndianInteger(parsed.integer)}`;
}

export function formatRate(value: Decimal): string {
  const parsed = parseDecimal(value, 2);
  if (!parsed) return "—";
  const rounded = round(parsed, 2);
  const meaningfulFraction = rounded.fraction.replace(/0+$/u, "");
  const sign = rounded.negative ? "-" : "";
  return meaningfulFraction
    ? `${sign}${groupIndianInteger(rounded.integer)}.${meaningfulFraction}%`
    : `${sign}${groupIndianInteger(rounded.integer)}%`;
}
