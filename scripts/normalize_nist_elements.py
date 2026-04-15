import re
import json
import os
import sys

SYMBOL_TO_NAME = {
    "H": "Hydrogen", "He": "Helium", "Li": "Lithium", "Be": "Beryllium", "B": "Boron",
    "C": "Carbon", "N": "Nitrogen", "O": "Oxygen", "F": "Fluorine", "Ne": "Neon",
    "Na": "Sodium", "Mg": "Magnesium", "Al": "Aluminum", "Si": "Silicon", "P": "Phosphorus",
    "S": "Sulfur", "Cl": "Chlorine", "Ar": "Argon", "K": "Potassium", "Ca": "Calcium",
    "Sc": "Scandium", "Ti": "Titanium", "V": "Vanadium", "Cr": "Chromium", "Mn": "Manganese",
    "Fe": "Iron", "Co": "Cobalt", "Ni": "Nickel", "Cu": "Copper", "Zn": "Zinc",
    "Ga": "Gallium", "Ge": "Germanium", "As": "Arsenic", "Se": "Selenium", "Br": "Bromine",
    "Kr": "Krypton", "Rb": "Rubidium", "Sr": "Strontium", "Y": "Yttrium", "Zr": "Zirconium",
    "Nb": "Niobium", "Mo": "Molybdenum", "Tc": "Technetium", "Ru": "Ruthenium", "Rh": "Rhodium",
    "Pd": "Palladium", "Ag": "Silver", "Cd": "Cadmium", "In": "Indium", "Sn": "Tin",
    "Sb": "Antimony", "Te": "Tellurium", "I": "Iodine", "Xe": "Xenon", "Cs": "Cesium",
    "Ba": "Barium", "La": "Lanthanum", "Ce": "Cerium", "Pr": "Praseodymium", "Nd": "Neodymium",
    "Pm": "Promethium", "Sm": "Samarium", "Eu": "Europium", "Gd": "Gdolinium", "Tb": "Terbium",
    "Dy": "Dysprosium", "Ho": "Holmium", "Er": "Erbium", "Tm": "Thulium", "Yb": "Ytterbium",
    "Lu": "Lutetium", "Hf": "Hafnium", "Ta": "Tantalum", "W": "Tungsten", "Re": "Rhenium",
    "Os": "Osmium", "Ir": "Iridium", "Pt": "Platinum", "Au": "Gold", "Hg": "Mercury",
    "Tl": "Thallium", "Pb": "Lead", "Bi": "Bismuth", "Po": "Polonium", "At": "Astatine",
    "Rn": "Radon", "Fr": "Francium", "Ra": "Radium", "Ac": "Actinium", "Th": "Thorium",
    "Pa": "Protactinium", "U": "Uranium", "Np": "Neptunium", "Pu": "Plutonium", "Am": "Americium",
    "Cm": "Curium", "Bk": "Berkelium", "Cf": "Californium", "Es": "Einsteinium", "Fm": "Fermium",
    "Md": "Mendelevium", "No": "Nobelium", "Lr": "Lawrencium", "Rf": "Rutherfordium", "Db": "Dubnium",
    "Sg": "Seaborgium", "Bh": "Bohrium", "Hs": "Hassium", "Mt": "Meitnerium", "Ds": "Darmstadtium",
    "Rg": "Roentgenium", "Cn": "Copernicium", "Nh": "Nihonium", "Fl": "Flerovium", "Mc": "Moscovium",
    "Lv": "Livermorium", "Ts": "Tennessine", "Og": "Oganesson",
    "D": "Deuterium", "T": "Tritium"
}

def clean_uncertainty(val):
    
    if not val: return ""
    return re.sub(r'\(.*?\)', '', val).strip()

def parse_mass_value(mass_str):
    
    if not mass_str: return None
    
    range_match = re.search(r'\[([\d.]+)\s*,\s*([\d.]+)\]', mass_str)
    if range_match:
        try:
            return (float(range_match.group(1)) + float(range_match.group(2))) / 2.0
        except ValueError:
            return None
    
    bracket_match = re.search(r'\[(\d+)\]', mass_str)
    if bracket_match:
        try:
            return float(bracket_match.group(1))
        except ValueError:
            return None

    val = clean_uncertainty(mass_str)
    try:
        val = val.replace(' ', '')
        return float(val)
    except ValueError:
        return None

def main():
    current_dir = os.path.dirname(os.path.abspath(__file__))
    root_dir = os.path.dirname(current_dir)
    input_path = os.path.join(root_dir, 'data', 'nist_raw.txt')
    output_path = os.path.join(root_dir, 'data', 'elements-reference.json')

    print(f"Leyendo fuente cruda: {input_path}")
    
    if not os.path.exists(input_path):
        print(f"ERROR: No se encuentra {input_path}")
        sys.exit(1)

    with open(input_path, 'r', encoding='utf-8') as f:
        raw_content = f.read()

    blocks = re.split(r'\n\s*\n', raw_content)
    
    elements = {}

    for block in blocks:
        if not block.strip():
            continue
            
        lines = block.strip().split('\n')
        data = {}
        for line in lines:
            if '=' in line:
                k, v = [x.strip() for x in line.split('=', 1)]
                data[k] = v
        
        if 'Atomic Number' not in data or 'Atomic Symbol' not in data:
            continue

        num = int(data['Atomic Number'])
        symbol = data['Atomic Symbol']
        
        canonical_symbol = symbol
        if symbol in ['D', 'T']:
            canonical_symbol = 'H'

        if canonical_symbol not in elements:
            elements[canonical_symbol] = {
                "name": SYMBOL_TO_NAME.get(canonical_symbol, canonical_symbol),
                "atomicNumber": num,
                "atomicMass": None
            }

        std_weight = data.get('Standard Atomic Weight', '')
        mass = parse_mass_value(std_weight)
        
        if mass is None:
            rel_mass = data.get('Relative Atomic Mass', '')
            mass = parse_mass_value(rel_mass)

        if mass is not None and elements[canonical_symbol]["atomicMass"] is None:
            elements[canonical_symbol]["atomicMass"] = mass

    final_output = {}
    
    sorted_elements = sorted(elements.items(), key=lambda x: x[1]['atomicNumber'])
    
    for sym, data in sorted_elements:
        if data["atomicMass"] is not None:
            final_output[sym] = data
        else:
            print(f"ADVERTENCIA: No se pudo determinar masa para {sym} ({data['atomicNumber']})")

    print(f"\n--- RESUMEN DE PROCESAMIENTO ---")
    print(f"Bloques analizados: {len(blocks)}")
    print(f"Elementos vlidos generados: {len(final_output)}")
    
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(final_output, f, indent=2)
        
    print(f"Archivo guardado exitosamente en: {output_path}")

if __name__ == "__main__":
    main()
