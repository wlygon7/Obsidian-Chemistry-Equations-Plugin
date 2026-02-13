# Chemistry Block

An [Obsidian](https://obsidian.md) plugin that renders chemical formulas, balances equations, and performs chemistry calculations — right inside your notes.

Think of it like `$$` math blocks, but for chemistry.

## Features

- **Formula rendering** — H2O displays with proper subscripts (H₂O), charges as superscripts, state symbols in italics
- **Equation rendering** — Arrows (`->`, `<->`) render as proper symbols (→, ⇌) with formatted reactants/products
- **Inline chemistry** — Write `chem:H2O` in inline code to render formatted chemistry anywhere in a sentence
- **Molar mass calculator** — Get molar mass with per-element breakdown for any compound
- **Equation balancer** — Automatically balance chemical equations using matrix-based Gaussian elimination
- **Unit conversion** — Convert between grams and moles
- **Stoichiometry solver** — Solve stoichiometry problems with step-by-step work shown
- **`$$$` quick trigger** — Type `$$$` at the start of a line to instantly create a chemistry block
- **All 118 elements** — Complete periodic table with IUPAC 2021 standard atomic weights

## Usage

### Rendering formulas and equations

Create a `chem` code block to render chemistry beautifully:

````
```chem
H2O
Ca3(PO4)2
CuSO4·5H2O
CH4(g) + 2O2(g) -> CO2(g) + 2H2O(l)
N2(g) + 3H2(g) <-> 2NH3(g)
```
````

Formulas get proper subscripts, superscripts for charges, and equations get arrow symbols with state labels.

### Inline chemistry

Use `` `chem:` `` inside inline code to render chemistry within text:

```
Water (`chem:H2O`) is essential for life. Table salt is `chem:NaCl`.
```

### Molar mass calculation

Prefix a formula with `molar:` or `calc:` to calculate its molar mass:

````
```chem
molar:C6H12O6
calc:CuSO4·5H2O
```
````

This shows the total molar mass and a per-element breakdown.

### Equation balancing

Prefix an equation with `balance:` to automatically balance it:

````
```chem
balance:Fe + O2 -> Fe2O3
balance:C3H8 + O2 -> CO2 + H2O
balance:KMnO4 + HCl -> KCl + MnCl2 + H2O + Cl2
```
````

### Unit conversion

Prefix with `convert:` to convert between grams and moles:

````
```chem
convert:5g H2O to mol
convert:2mol NaCl to g
```
````

### Stoichiometry

Prefix with `stoich:` to solve stoichiometry problems step-by-step:

````
```chem
stoich:2H2 + O2 -> 2H2O | 5g H2 -> ? g H2O
stoich:CH4 + 2O2 -> CO2 + 2H2O | 10g CH4 -> ? g CO2
```
````

Format: `equation | known-value formula -> ? target-unit target-formula`

## Quick insertion

- **`$$$` trigger**: Type `$$$` at the start of a line and it auto-converts into a ` ```chem ` block
- **Commands** (bindable to hotkeys via Settings → Hotkeys):
  - `Chemistry Block: Insert chemistry block` — inserts a ` ```chem ` block at the cursor
  - `Chemistry Block: Insert inline chemistry` — wraps selected text in `` `chem:` `` or inserts an empty inline tag

## Settings

Open **Settings → Community Plugins → Chemistry Block** to configure:

| Setting | Description | Default |
|---------|-------------|---------|
| Decimal places | Precision for calculation results (0–6) | 3 |
| Inline chemistry rendering | Render `` `chem:` `` inline code as formatted chemistry | On |
| Show element breakdown | Show per-element mass in molar mass calculations | On |
| Render reaction arrows | Convert `->` to arrow symbols and render state symbols | On |

## Supported notation

| Input | Renders as |
|-------|-----------|
| `H2O` | H₂O |
| `Ca3(PO4)2` | Ca₃(PO₄)₂ |
| `Fe3+` | Fe³⁺ |
| `SO4^2-` | SO₄²⁻ |
| `CuSO4·5H2O` | CuSO₄·5H₂O |
| `(g)`, `(l)`, `(s)`, `(aq)` | Italic state symbols |
| `->` | → |
| `<->` or `<=>` | ⇌ |
