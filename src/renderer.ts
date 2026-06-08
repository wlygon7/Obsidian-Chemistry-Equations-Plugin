import { renderMath, finishRenderMath } from 'obsidian';

// Element group classification for color-coding in DOM fallback renderer
const ELEMENT_GROUP: Record<string, string> = {
  H: 'nonmetal',
  He: 'noble', Ne: 'noble', Ar: 'noble', Kr: 'noble', Xe: 'noble', Rn: 'noble', Og: 'noble',
  Li: 'alkali', Na: 'alkali', K: 'alkali', Rb: 'alkali', Cs: 'alkali', Fr: 'alkali',
  Be: 'alkaline', Mg: 'alkaline', Ca: 'alkaline', Sr: 'alkaline', Ba: 'alkaline', Ra: 'alkaline',
  C: 'carbon',
  N: 'nonmetal', O: 'nonmetal', P: 'nonmetal', S: 'nonmetal', Se: 'nonmetal',
  F: 'halogen', Cl: 'halogen', Br: 'halogen', I: 'halogen', At: 'halogen', Ts: 'halogen',
  B: 'metalloid', Si: 'metalloid', Ge: 'metalloid', As: 'metalloid', Sb: 'metalloid',
  Te: 'metalloid', Po: 'metalloid',
  Al: 'post', Ga: 'post', In: 'post', Sn: 'post', Tl: 'post', Pb: 'post', Bi: 'post',
  Nh: 'post', Fl: 'post', Mc: 'post', Lv: 'post',
};

function getElementClass(symbol: string): string {
  return 'chem-el-' + (ELEMENT_GROUP[symbol] ?? 'transition');
}

function extractStateSymbol(text: string): { formula: string; state?: string } {
  const match = text.match(/^(.+?)\s*\((s|l|g|aq)\)\s*$/);
  if (match) return { formula: match[1].trim(), state: match[2] };
  return { formula: text.trim() };
}

// ============================================================
// LaTeX converter → uses Obsidian's built-in KaTeX renderer
// ============================================================

function formulaToLatex(text: string): string {
  const stateMatch = text.trim().match(/^(.+?)\s*\((s|l|g|aq)\)\s*$/);
  let formula = text.trim();
  let stateLatex = '';

  if (stateMatch) {
    formula = stateMatch[1].trim();
    stateLatex = `\\,\\text{(${stateMatch[2]})}`;
  }

  let pos = 0;
  let result = '';
  const f = formula;

  // Leading coefficient
  if (pos < f.length && /\d/.test(f[pos])) {
    let numStr = '';
    const start = pos;
    while (pos < f.length && /\d/.test(f[pos])) { numStr += f[pos]; pos++; }
    if (pos < f.length && /[A-Z(]/.test(f[pos])) {
      result += numStr;
    } else {
      pos = start;
    }
  }

  while (pos < f.length) {
    if (/[A-Z]/.test(f[pos])) {
      let symbol = f[pos]; pos++;
      if (pos < f.length && /[a-z]/.test(f[pos])) { symbol += f[pos]; pos++; }
      result += `\\mathrm{${symbol}}`;

      let numStr = '';
      while (pos < f.length && /\d/.test(f[pos])) { numStr += f[pos]; pos++; }
      if (numStr && numStr !== '1') result += `_{${numStr}}`;

    } else if (f[pos] === '(') {
      result += '('; pos++;
    } else if (f[pos] === ')') {
      result += ')'; pos++;
      let numStr = '';
      while (pos < f.length && /\d/.test(f[pos])) { numStr += f[pos]; pos++; }
      if (numStr) result += `_{${numStr}}`;

    } else if (f[pos] === '^') {
      pos++;
      let chargeStr = '';
      while (pos < f.length && /[\d+\-]/.test(f[pos])) { chargeStr += f[pos]; pos++; }
      if (chargeStr) result += `^{${chargeStr}}`;

    } else if ((f[pos] === '+' || f[pos] === '-') && pos > 0) {
      const remaining = f.substring(pos);
      const chargeMatch = remaining.match(/^(\d*[+\-])$/);
      if (chargeMatch) {
        result += `^{${chargeMatch[1]}}`;
        pos += chargeMatch[1].length;
      } else {
        result += f[pos]; pos++;
      }
    } else if (f[pos] === '·' || f[pos] === '*') {
      result += '\\cdot '; pos++;
    } else {
      result += f[pos]; pos++;
    }
  }

  return result + stateLatex;
}

function equationToLatex(text: string): string {
  const s = text.trim();
  let arrowLatex: string;
  let parts: string[];

  if (s.includes('<=>')) {
    arrowLatex = '\\rightleftharpoons'; parts = s.split('<=>');
  } else if (s.includes('<->')) {
    arrowLatex = '\\rightleftharpoons'; parts = s.split('<->');
  } else if (s.includes('->')) {
    arrowLatex = '\\longrightarrow'; parts = s.split('->');
  } else {
    return formulaToLatex(s);
  }

  if (parts.length !== 2) return formulaToLatex(s);

  const reactants = parts[0].split(/\s+\+\s+/).map(t => formulaToLatex(t.trim())).join(' + ');
  const products = parts[1].split(/\s+\+\s+/).map(t => formulaToLatex(t.trim())).join(' + ');

  return `${reactants} ${arrowLatex} ${products}`;
}

// Render a chemical formula using Obsidian's KaTeX renderer
export function renderFormulaKatex(text: string, container: HTMLElement, displayMode = false): void {
  try {
    const latex = formulaToLatex(text.trim());
    const el = renderMath(latex, displayMode);
    container.appendChild(el);
    finishRenderMath();
  } catch {
    renderFormula(text, container);
  }
}

// Render a full equation using Obsidian's KaTeX renderer (display mode by default)
export function renderEquationKatex(text: string, container: HTMLElement, displayMode = true): void {
  try {
    const latex = equationToLatex(text.trim());
    const el = renderMath(latex, displayMode);
    container.appendChild(el);
    finishRenderMath();
  } catch {
    renderEquation(text, container);
  }
}

// ============================================================
// DOM-based renderer (fallback with element color-coding)
// ============================================================

export function renderFormula(text: string, container: HTMLElement): HTMLElement {
  const span = container.createSpan({ cls: 'chem-formula' });
  const s = text.trim();
  let pos = 0;

  // Leading coefficient
  if (pos < s.length && /\d/.test(s[pos])) {
    let numStr = '';
    const start = pos;
    while (pos < s.length && /\d/.test(s[pos])) { numStr += s[pos]; pos++; }
    if (pos < s.length && /[A-Z(]/.test(s[pos])) {
      span.createSpan({ cls: 'chem-coefficient', text: numStr });
    } else {
      pos = start;
    }
  }

  while (pos < s.length) {
    if (/[A-Z]/.test(s[pos])) {
      let symbol = s[pos]; pos++;
      if (pos < s.length && /[a-z]/.test(s[pos])) { symbol += s[pos]; pos++; }
      span.createSpan({ cls: `chem-element ${getElementClass(symbol)}`, text: symbol });

      let numStr = '';
      while (pos < s.length && /\d/.test(s[pos])) { numStr += s[pos]; pos++; }
      if (numStr && numStr !== '1') { span.createEl('sub', { text: numStr }); }

    } else if (s[pos] === '(') {
      span.createSpan({ text: '(' }); pos++;
    } else if (s[pos] === ')') {
      span.createSpan({ text: ')' }); pos++;
      let numStr = '';
      while (pos < s.length && /\d/.test(s[pos])) { numStr += s[pos]; pos++; }
      if (numStr) { span.createEl('sub', { text: numStr }); }
    } else if (s[pos] === '^') {
      pos++;
      let chargeStr = '';
      while (pos < s.length && /[\d\+\-]/.test(s[pos])) { chargeStr += s[pos]; pos++; }
      if (chargeStr) { span.createEl('sup', { cls: 'chem-charge', text: chargeStr }); }
    } else if ((s[pos] === '+' || s[pos] === '-') && pos > 0) {
      const remaining = s.substring(pos);
      const chargeMatch = remaining.match(/^(\d*[\+\-])$/);
      if (chargeMatch) {
        span.createEl('sup', { cls: 'chem-charge', text: chargeMatch[1] });
        pos += chargeMatch[1].length;
      } else {
        span.createSpan({ text: s[pos] }); pos++;
      }
    } else if (s[pos] === '·' || s[pos] === '*') {
      span.createSpan({ cls: 'chem-hydrate-dot', text: '·' }); pos++;
    } else {
      span.createSpan({ text: s[pos] }); pos++;
    }
  }

  return span;
}

export function renderEquation(text: string, container: HTMLElement): HTMLElement {
  const div = container.createDiv({ cls: 'chem-equation' });
  const s = text.trim();

  let arrowSymbol: string;
  let parts: string[];

  if (s.includes('<=>')) {
    arrowSymbol = '⇌'; parts = s.split('<=>');
  } else if (s.includes('<->')) {
    arrowSymbol = '⇌'; parts = s.split('<->');
  } else if (s.includes('->')) {
    arrowSymbol = '→'; parts = s.split('->');
  } else {
    renderFormula(s, div);
    return div;
  }

  if (parts.length !== 2) { renderFormula(s, div); return div; }

  const reactantTerms = parts[0].split(/\s+\+\s+/);
  reactantTerms.forEach((term, i) => {
    if (i > 0) div.createSpan({ cls: 'chem-plus', text: ' + ' });
    const { formula, state } = extractStateSymbol(term.trim());
    renderFormula(formula, div);
    if (state) div.createSpan({ cls: 'chem-state', text: `(${state})` });
  });

  div.createSpan({ cls: 'chem-arrow', text: ` ${arrowSymbol} ` });

  const productTerms = parts[1].split(/\s+\+\s+/);
  productTerms.forEach((term, i) => {
    if (i > 0) div.createSpan({ cls: 'chem-plus', text: ' + ' });
    const { formula, state } = extractStateSymbol(term.trim());
    renderFormula(formula, div);
    if (state) div.createSpan({ cls: 'chem-state', text: `(${state})` });
  });

  return div;
}
