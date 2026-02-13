// Render chemical formulas and equations into beautiful DOM elements

function extractStateSymbol(text: string): { formula: string; state?: string } {
  const match = text.match(/^(.+?)\s*\((s|l|g|aq)\)\s*$/);
  if (match) return { formula: match[1].trim(), state: match[2] };
  return { formula: text.trim() };
}

// Render a chemical formula string with proper subscripts and superscripts
export function renderFormula(text: string, container: HTMLElement): HTMLElement {
  const span = container.createSpan({ cls: 'chem-formula' });
  const s = text.trim();
  let pos = 0;

  // Leading coefficient: digits before first letter or '('
  if (pos < s.length && /\d/.test(s[pos])) {
    let numStr = '';
    const start = pos;
    while (pos < s.length && /\d/.test(s[pos])) {
      numStr += s[pos];
      pos++;
    }
    if (pos < s.length && /[A-Z(]/.test(s[pos])) {
      span.createSpan({ cls: 'chem-coefficient', text: numStr });
    } else {
      pos = start;
    }
  }

  while (pos < s.length) {
    if (/[A-Z]/.test(s[pos])) {
      // Element symbol
      let symbol = s[pos];
      pos++;
      if (pos < s.length && /[a-z]/.test(s[pos])) {
        symbol += s[pos];
        pos++;
      }
      span.createSpan({ cls: 'chem-element', text: symbol });

      // Subscript count
      let numStr = '';
      while (pos < s.length && /\d/.test(s[pos])) {
        numStr += s[pos];
        pos++;
      }
      if (numStr && numStr !== '1') {
        span.createEl('sub', { text: numStr });
      }
    } else if (s[pos] === '(') {
      span.createSpan({ text: '(' });
      pos++;
    } else if (s[pos] === ')') {
      span.createSpan({ text: ')' });
      pos++;
      // Subscript after closing paren
      let numStr = '';
      while (pos < s.length && /\d/.test(s[pos])) {
        numStr += s[pos];
        pos++;
      }
      if (numStr) {
        span.createEl('sub', { text: numStr });
      }
    } else if (s[pos] === '^') {
      // Explicit charge: ^2+, ^3-, ^+, ^-
      pos++;
      let chargeStr = '';
      while (pos < s.length && /[\d\+\-]/.test(s[pos])) {
        chargeStr += s[pos];
        pos++;
      }
      if (chargeStr) {
        span.createEl('sup', { cls: 'chem-charge', text: chargeStr });
      }
    } else if ((s[pos] === '+' || s[pos] === '-') && pos > 0) {
      // Trailing charge without ^: Fe3+, OH-
      // Check if this is a charge (at end of formula or followed by more charge chars)
      const remaining = s.substring(pos);
      const chargeMatch = remaining.match(/^(\d*[\+\-])$/);
      if (chargeMatch) {
        span.createEl('sup', { cls: 'chem-charge', text: chargeMatch[1] });
        pos += chargeMatch[1].length;
      } else {
        span.createSpan({ text: s[pos] });
        pos++;
      }
    } else if (s[pos] === '\u00B7' || s[pos] === '*') {
      // Hydrate dot
      span.createSpan({ cls: 'chem-hydrate-dot', text: '\u00B7' });
      pos++;
    } else {
      span.createSpan({ text: s[pos] });
      pos++;
    }
  }

  return span;
}

// Render a full chemical equation with arrows and state symbols
export function renderEquation(text: string, container: HTMLElement): HTMLElement {
  const div = container.createDiv({ cls: 'chem-equation' });
  const s = text.trim();

  // Detect arrow type
  let arrowSymbol: string;
  let parts: string[];

  if (s.includes('<=>')) {
    arrowSymbol = '\u21CC';
    parts = s.split('<=>');
  } else if (s.includes('<->')) {
    arrowSymbol = '\u21CC';
    parts = s.split('<->');
  } else if (s.includes('->')) {
    arrowSymbol = '\u2192';
    parts = s.split('->');
  } else {
    // No arrow, render as single formula
    renderFormula(s, div);
    return div;
  }

  if (parts.length !== 2) {
    renderFormula(s, div);
    return div;
  }

  // Render reactants
  const reactantTerms = parts[0].split(/\s+\+\s+/);
  reactantTerms.forEach((term, i) => {
    if (i > 0) div.createSpan({ cls: 'chem-plus', text: ' + ' });
    const { formula, state } = extractStateSymbol(term.trim());
    renderFormula(formula, div);
    if (state) {
      div.createSpan({ cls: 'chem-state', text: `(${state})` });
    }
  });

  // Arrow
  div.createSpan({ cls: 'chem-arrow', text: ` ${arrowSymbol} ` });

  // Render products
  const productTerms = parts[1].split(/\s+\+\s+/);
  productTerms.forEach((term, i) => {
    if (i > 0) div.createSpan({ cls: 'chem-plus', text: ' + ' });
    const { formula, state } = extractStateSymbol(term.trim());
    renderFormula(formula, div);
    if (state) {
      div.createSpan({ cls: 'chem-state', text: `(${state})` });
    }
  });

  return div;
}
