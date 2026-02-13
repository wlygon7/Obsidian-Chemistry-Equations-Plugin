import { ELEMENT_MASSES } from './periodic-table';

export interface ParsedFormula {
  elements: Record<string, number>;
  coefficient: number;
  charge?: number;
  state?: string;
  original: string;
}

export interface ParsedEquation {
  reactants: ParsedFormula[];
  products: ParsedFormula[];
  arrowType: '->' | '<->' | '<=>';
  original: string;
}

// Strip state symbols like (s), (l), (g), (aq) from end of formula
function extractStateSymbol(text: string): { formula: string; state?: string } {
  const match = text.match(/^(.+?)\s*\((s|l|g|aq)\)\s*$/);
  if (match) return { formula: match[1].trim(), state: match[2] };
  return { formula: text.trim() };
}

export function parseFormula(input: string): ParsedFormula {
  const raw = input.trim();
  const { formula: withoutState, state } = extractStateSymbol(raw);
  const s = withoutState;

  let pos = 0;
  let coefficient = 1;

  // Extract leading coefficient: digits before first letter or '('
  if (pos < s.length && /\d/.test(s[pos])) {
    let numStr = '';
    const start = pos;
    while (pos < s.length && /\d/.test(s[pos])) {
      numStr += s[pos];
      pos++;
    }
    // Only treat as coefficient if followed by an element or '('
    if (pos < s.length && /[A-Z(]/.test(s[pos])) {
      coefficient = parseInt(numStr);
    } else {
      pos = start; // not a coefficient, reset
    }
  }

  function parseGroup(): Record<string, number> {
    const result: Record<string, number> = {};

    while (pos < s.length) {
      if (s[pos] === '(') {
        pos++; // skip '('
        const inner = parseGroup();
        if (pos < s.length && s[pos] === ')') pos++; // skip ')'
        const mult = parseCount();
        for (const [el, cnt] of Object.entries(inner)) {
          result[el] = (result[el] || 0) + cnt * mult;
        }
      } else if (/[A-Z]/.test(s[pos])) {
        let symbol = s[pos];
        pos++;
        if (pos < s.length && /[a-z]/.test(s[pos])) {
          symbol += s[pos];
          pos++;
        }
        const count = parseCount();
        result[symbol] = (result[symbol] || 0) + count;
      } else if (s[pos] === '\u00B7' || s[pos] === '*') {
        // Hydrate dot: CuSO4·5H2O
        pos++;
        const hydCoeff = parseCount();
        const hydrate = parseGroup();
        for (const [el, cnt] of Object.entries(hydrate)) {
          result[el] = (result[el] || 0) + cnt * hydCoeff;
        }
      } else if (s[pos] === ')') {
        break; // end of parenthetical group
      } else {
        break; // unknown char, stop parsing
      }
    }
    return result;
  }

  function parseCount(): number {
    let numStr = '';
    while (pos < s.length && /\d/.test(s[pos])) {
      numStr += s[pos];
      pos++;
    }
    return numStr ? parseInt(numStr) : 1;
  }

  const elements = parseGroup();

  // Parse optional charge at end: 2+, 3-, +, -, ^2+, ^3-
  let charge: number | undefined;
  if (pos < s.length && s[pos] === '^') {
    pos++;
  }
  if (pos < s.length) {
    const remaining = s.substring(pos);
    const chargeMatch = remaining.match(/^(\d*)([\+\-])$/);
    if (chargeMatch) {
      const magnitude = chargeMatch[1] ? parseInt(chargeMatch[1]) : 1;
      charge = chargeMatch[2] === '+' ? magnitude : -magnitude;
    }
  }

  return { elements, coefficient, charge, state, original: raw };
}

export function parseEquation(input: string): ParsedEquation {
  const original = input.trim();
  let arrowType: '->' | '<->' | '<=>';
  let arrowIndex: number;

  // Check longer arrows first
  if (original.includes('<=>')) {
    arrowType = '<=>';
    arrowIndex = original.indexOf('<=>');
  } else if (original.includes('<->')) {
    arrowType = '<->';
    arrowIndex = original.indexOf('<->');
  } else if (original.includes('->')) {
    arrowType = '->';
    arrowIndex = original.indexOf('->');
  } else {
    throw new Error('No reaction arrow found. Use ->, <->, or <=>');
  }

  const lhs = original.substring(0, arrowIndex).trim();
  const rhs = original.substring(arrowIndex + arrowType.length).trim();

  // Split on ' + ' (space-padded) to avoid splitting charges like Fe3+
  const reactants = lhs.split(/\s+\+\s+/).map(s => parseFormula(s.trim()));
  const products = rhs.split(/\s+\+\s+/).map(s => parseFormula(s.trim()));

  return { reactants, products, arrowType, original };
}

// Calculate molar mass from parsed elements
export function getMolarMass(elements: Record<string, number>): number {
  let mass = 0;
  for (const [element, count] of Object.entries(elements)) {
    if (!(element in ELEMENT_MASSES)) {
      throw new Error(`Unknown element: ${element}`);
    }
    mass += ELEMENT_MASSES[element] * count;
  }
  return mass;
}
