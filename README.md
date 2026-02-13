# Chemistry Block

An [Obsidian](https://obsidian.md) plugin that renders chemical formulas, balances equations, and performs chemistry calculations -- right inside your notes.

Think of it like `$$` math blocks, but for chemistry.

## Features

### Rendering
- **Formula rendering** -- H2O displays with proper subscripts (H2O), charges as superscripts, state symbols in italics
- **Equation rendering** -- Arrows (`->`, `<->`) render as proper symbols with formatted reactants/products
- **Inline chemistry** -- Write `chem:H2O` in inline code to render formatted chemistry anywhere in a sentence

### Calculations
- **Molar mass** -- Per-element breakdown for any compound
- **Percent composition** -- Mass percentage of each element in a compound
- **Empirical & molecular formula** -- Determine formulas from percent composition data
- **Equation balancer** -- Automatically balance equations using Gaussian elimination
- **Stoichiometry solver** -- Step-by-step stoichiometry with molar ratios
- **Limiting reagent** -- Identify limiting reagent, products formed, and excess remaining
- **Percent yield** -- Calculate percent yield from actual and theoretical amounts
- **Unit conversion** -- Convert between grams, moles, liters (STP), and particles
- **Molarity & dilution** -- Calculate concentration and M1V1 = M2V2
- **Ideal gas law** -- Solve PV = nRT for any variable
- **pH / pOH** -- Strong acids/bases, weak acid/base equilibrium with quadratic solver
- **Electron configuration** -- Full orbital notation with noble gas core abbreviation
- **Oxidation states** -- Rules-based oxidation state determination
- **Thermochemistry** -- q = mcDT calculations
- **Equilibrium constant** -- Calculate Keq from concentrations

### Extras
- **`$$$` quick trigger** -- Type `$$$` at the start of a line to instantly create a chemistry block
- **All 118 elements** -- Complete periodic table with IUPAC 2021 standard atomic weights
- **6 configurable settings** -- Customize decimal places, step display, and more

## Usage

### Rendering formulas and equations

Create a `chem` code block to render chemistry beautifully:

````
```chem
H2O
Ca3(PO4)2
CuSO4*5H2O
CH4(g) + 2O2(g) -> CO2(g) + 2H2O(l)
N2(g) + 3H2(g) <-> 2NH3(g)
```
````

### Inline chemistry

Use `` `chem:` `` inside inline code to render chemistry within text:

```
Water (`chem:H2O`) is essential for life. Table salt is `chem:NaCl`.
```

### Molar mass

````
```chem
molar:C6H12O6
calc:CuSO4*5H2O
```
````

### Percent composition

````
```chem
composition:C6H12O6
composition:Ca3(PO4)2
```
````

Shows a table with each element's count, mass contribution, and percentage.

### Empirical & molecular formula

````
```chem
empirical:C 40% H 6.7% O 53.3%
molecular:C 40% H 6.7% O 53.3% | 180
```
````

The molecular formula takes the molar mass after `|` to determine the multiplier.

### Equation balancing

````
```chem
balance:Fe + O2 -> Fe2O3
balance:C3H8 + O2 -> CO2 + H2O
balance:KMnO4 + HCl -> KCl + MnCl2 + H2O + Cl2
```
````

### Unit conversion

````
```chem
convert:5g H2O to mol
convert:2mol O2 to L
convert:5g H2O to particles
convert:0.5M 2L NaCl to g
```
````

Supports: grams, moles, liters (at STP), particles, and molarity format.

### Stoichiometry

````
```chem
stoich:2H2 + O2 -> 2H2O | 5g H2 -> ? g H2O
stoich:CH4 + 2O2 -> CO2 + 2H2O | 10g CH4 -> ? g CO2
```
````

Format: `equation | known-value formula -> ? target-unit target-formula`

### Limiting reagent

````
```chem
limiting:2H2 + O2 -> 2H2O | 5g H2, 10g O2
limiting:2Al + 3Cl2 -> 2AlCl3 | 10g Al, 20g Cl2
```
````

Shows a comparison table, identifies the limiting reagent, calculates products formed and excess remaining.

### Percent yield

````
```chem
yield:actual 5g, theoretical 9g
yield:2H2 + O2 -> 2H2O | 5g H2 -> 4g H2O
```
````

Simple mode takes actual and theoretical directly. Equation mode calculates theoretical from stoichiometry.

### Molarity & dilution

````
```chem
molarity:5.85g NaCl in 500mL
molarity:0.5mol NaCl in 2L
dilution:1M 0.5L to 2L
```
````

### Ideal gas law (PV = nRT)

````
```chem
gas:P=1atm V=? n=2mol T=273K
gas:P=? V=10L n=0.5mol T=300K
gas:P=760mmHg V=2L n=? T=25C
```
````

Mark the unknown variable with `?`. Supports unit conversion: kPa, mmHg/torr for pressure; mL for volume; C for temperature (auto-converts to K).

### pH / pOH

````
```chem
pH:0.01
pH:strong acid 0.01M HCl
pH:strong base 0.1M NaOH
pH:weak acid 0.1M Ka=1.8e-5
pOH:0.001
```
````

Shows pH, pOH, [H+], [OH-], and classifies as acidic/basic/neutral. Weak acid mode solves the quadratic equilibrium expression.

### Electron configuration

````
```chem
config:Fe
config:Fe3+
config:O2-
config:Cu
```
````

Shows full orbital notation with superscript electron counts. Handles known exceptions (Cr, Cu, Mo, Ag, etc.) and noble gas core abbreviation.

### Oxidation states

````
```chem
oxidation:KMnO4
oxidation:Cr2O7^2-
oxidation:H2O2
```
````

Uses standard rules (F=-1, O=-2, H=+1, Group 1/2 metals) and solves algebraically for unknown elements. Detects peroxides and metal hydrides.

### Thermochemistry (q = mcDT)

````
```chem
enthalpy:m=100g C=4.184 dT=25
enthalpy:q=? m=50g C=4.184 dT=10
enthalpy:q=5000J m=? C=4.184 dT=15
```
````

Solves for any missing variable. Shows result in both J and kJ, classifies as endothermic or exothermic.

### Equilibrium constant

````
```chem
Keq:N2 + 3H2 <-> 2NH3 | [N2]=0.5 [H2]=0.3 [NH3]=0.2
```
````

Builds the K expression symbolically, calculates numerically, and classifies whether products or reactants are favored.

## Quick insertion

- **`$$$` trigger**: Type `$$$` at the start of a line and it auto-converts into a ` ```chem ` block
- **Commands** (bindable to hotkeys via Settings -> Hotkeys):
  - `Chemistry Block: Insert chemistry block` -- inserts a ` ```chem ` block at the cursor
  - `Chemistry Block: Insert inline chemistry` -- wraps selected text in `` `chem:` `` or inserts an empty inline tag

## All prefixes

| Prefix | Feature | Example |
|--------|---------|---------|
| *(none)* | Render formula/equation | `H2O`, `CH4 + 2O2 -> CO2 + 2H2O` |
| `molar:` / `calc:` | Molar mass | `molar:C6H12O6` |
| `composition:` | Percent composition | `composition:C6H12O6` |
| `empirical:` | Empirical formula | `empirical:C 40% H 6.7% O 53.3%` |
| `molecular:` | Molecular formula | `molecular:C 40% H 6.7% O 53.3% \| 180` |
| `balance:` | Balance equation | `balance:Fe + O2 -> Fe2O3` |
| `convert:` | Unit conversion | `convert:5g H2O to mol` |
| `stoich:` | Stoichiometry | `stoich:2H2 + O2 -> 2H2O \| 5g H2 -> ? g H2O` |
| `limiting:` | Limiting reagent | `limiting:2H2 + O2 -> 2H2O \| 5g H2, 10g O2` |
| `yield:` | Percent yield | `yield:actual 5g, theoretical 9g` |
| `molarity:` | Molarity | `molarity:5.85g NaCl in 500mL` |
| `dilution:` | Dilution | `dilution:1M 0.5L to 2L` |
| `gas:` | Ideal gas law | `gas:P=1atm V=? n=2mol T=273K` |
| `pH:` | pH calculation | `pH:0.01` |
| `pOH:` | pOH calculation | `pOH:0.001` |
| `config:` | Electron config | `config:Fe3+` |
| `oxidation:` | Oxidation states | `oxidation:KMnO4` |
| `enthalpy:` | Thermochemistry | `enthalpy:m=100g C=4.184 dT=25` |
| `Keq:` | Equilibrium | `Keq:N2 + 3H2 <-> 2NH3 \| [N2]=0.5 [H2]=0.3 [NH3]=0.2` |

## Settings

Open **Settings -> Community Plugins -> Chemistry Block** to configure:

| Setting | Description | Default |
|---------|-------------|---------|
| Decimal places | Precision for calculation results (0-6) | 3 |
| Inline chemistry rendering | Render `` `chem:` `` inline code as formatted chemistry | On |
| Show element breakdown | Show per-element mass in molar mass calculations | On |
| Render reaction arrows | Convert `->` to arrow symbols and render state symbols | On |
| Show calculation steps | Display intermediate steps in calculations | On |
| Noble gas core abbreviation | Use [Ar], [Kr], etc. in electron configurations | On |

## Supported notation

| Input | Renders as |
|-------|-----------|
| `H2O` | H2O |
| `Ca3(PO4)2` | Ca3(PO4)2 |
| `Fe3+` | Fe3+ |
| `SO4^2-` | SO4 2- |
| `CuSO4*5H2O` | CuSO4*5H2O |
| `(g)`, `(l)`, `(s)`, `(aq)` | Italic state symbols |
| `->` | -> |
| `<->` or `<=>` | <-> |

## License

MIT
