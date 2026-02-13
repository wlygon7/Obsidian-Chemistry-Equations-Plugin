import { parseEquation } from './parser';
import { renderEquation } from './renderer';
import type ChemistryPlugin from './main';

function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) {
    [a, b] = [b, a % b];
  }
  return a;
}

function lcm(a: number, b: number): number {
  return Math.abs(a * b) / gcd(a, b);
}

// Balance a chemical equation using matrix null-space via Gaussian elimination
export function balanceEquation(equationStr: string): number[] {
  const eq = parseEquation(equationStr);
  const compounds = [...eq.reactants, ...eq.products];
  const numCompounds = compounds.length;

  // Collect all unique elements
  const elementSet = new Set<string>();
  for (const compound of compounds) {
    for (const el of Object.keys(compound.elements)) {
      elementSet.add(el);
    }
  }
  const elements = Array.from(elementSet);
  const numElements = elements.length;

  // Build composition matrix
  // Rows = elements, Columns = compounds
  // Reactants positive, products negative
  const matrix: number[][] = [];
  for (let i = 0; i < numElements; i++) {
    const row: number[] = [];
    for (let j = 0; j < numCompounds; j++) {
      const count = compounds[j].elements[elements[i]] || 0;
      row.push(j < eq.reactants.length ? count : -count);
    }
    matrix.push(row);
  }

  // Gaussian elimination to RREF
  let pivotRow = 0;
  const pivotCols: number[] = [];

  for (let col = 0; col < numCompounds && pivotRow < numElements; col++) {
    // Find row with largest absolute value in this column
    let maxRow = pivotRow;
    for (let row = pivotRow + 1; row < numElements; row++) {
      if (Math.abs(matrix[row][col]) > Math.abs(matrix[maxRow][col])) {
        maxRow = row;
      }
    }

    if (Math.abs(matrix[maxRow][col]) < 1e-10) continue;

    // Swap rows
    [matrix[pivotRow], matrix[maxRow]] = [matrix[maxRow], matrix[pivotRow]];

    // Scale pivot row
    const scale = matrix[pivotRow][col];
    for (let j = 0; j < numCompounds; j++) {
      matrix[pivotRow][j] /= scale;
    }

    // Eliminate column in all other rows
    for (let row = 0; row < numElements; row++) {
      if (row === pivotRow) continue;
      const factor = matrix[row][col];
      if (Math.abs(factor) < 1e-10) continue;
      for (let j = 0; j < numCompounds; j++) {
        matrix[row][j] -= factor * matrix[pivotRow][j];
      }
    }

    pivotCols.push(col);
    pivotRow++;
  }

  // Find free variables (columns that are not pivot columns)
  const freeCols: number[] = [];
  for (let col = 0; col < numCompounds; col++) {
    if (!pivotCols.includes(col)) {
      freeCols.push(col);
    }
  }

  if (freeCols.length === 0) {
    throw new Error('Equation cannot be balanced (no free variables)');
  }

  // Set first free variable to 1 and solve for pivot variables
  const freeCol = freeCols[0];
  const result = new Array(numCompounds).fill(0);
  result[freeCol] = 1;

  for (let i = pivotCols.length - 1; i >= 0; i--) {
    const pc = pivotCols[i];
    result[pc] = -matrix[i][freeCol];
  }

  // Make all coefficients positive
  if (result.some((c: number) => c < -1e-10)) {
    // If some are negative, flip signs
    const hasNeg = result.some((c: number) => c < -1e-10);
    const hasPos = result.some((c: number) => c > 1e-10);
    if (hasNeg && hasPos) {
      // Mixed signs - this can happen; flip all negatives
      for (let i = 0; i < result.length; i++) {
        result[i] = Math.abs(result[i]);
      }
    } else if (hasNeg) {
      for (let i = 0; i < result.length; i++) {
        result[i] = -result[i];
      }
    }
  }

  // Convert to smallest positive integers
  // Multiply by large number, round, then divide by GCD
  const PRECISION = 1000000;
  const intCoeffs = result.map((c: number) => Math.round(c * PRECISION));
  let g = Math.abs(intCoeffs[0]);
  for (let i = 1; i < intCoeffs.length; i++) {
    if (intCoeffs[i] !== 0) {
      g = gcd(g, Math.abs(intCoeffs[i]));
    }
  }
  if (g === 0) g = 1;

  return intCoeffs.map((c: number) => c / g);
}

export function balanceAndDisplay(
  plugin: ChemistryPlugin,
  equationStr: string,
  container: HTMLElement
): void {
  try {
    const eq = parseEquation(equationStr);
    const coefficients = balanceEquation(equationStr);

    // Build balanced equation string
    const reactantParts: string[] = [];
    for (let i = 0; i < eq.reactants.length; i++) {
      const coeff = coefficients[i] === 1 ? '' : String(coefficients[i]);
      reactantParts.push(coeff + eq.reactants[i].original);
    }

    const productParts: string[] = [];
    for (let i = 0; i < eq.products.length; i++) {
      const idx = eq.reactants.length + i;
      const coeff = coefficients[idx] === 1 ? '' : String(coefficients[idx]);
      productParts.push(coeff + eq.products[i].original);
    }

    const arrowStr = eq.arrowType;
    const balancedStr = reactantParts.join(' + ') + ' ' + arrowStr + ' ' + productParts.join(' + ');

    const resultDiv = container.createDiv({ cls: 'chem-result' });
    resultDiv.createEl('div', { cls: 'chem-label', text: 'Balanced Equation:' });
    renderEquation(balancedStr, resultDiv);
    resultDiv.createDiv({
      cls: 'chem-info',
      text: `Original: ${equationStr}`
    });
  } catch (error) {
    container.createDiv({
      cls: 'chem-error',
      text: `Balancing error: ${error instanceof Error ? error.message : String(error)}`
    });
  }
}
