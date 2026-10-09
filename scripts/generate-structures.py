"""Build static quiz SVGs. Development only: pip install rdkit==2026.9.1.

Uses the same isomeric SMILES as the reference cards. No browser or server
chemistry dependency. The 3D views are calculated conformers, not measurements.
"""
import hashlib
import json
import math
from pathlib import Path
import re

try:
    import numpy as np
    from rdkit import Chem
    from rdkit.Chem import AllChem, rdDepictor, rdMolDescriptors
    from rdkit.Chem.Draw import rdMolDraw2D
    from rdkit.Geometry import Point3D
except ImportError as error:
    raise SystemExit("Install the development dependency: pip install rdkit==2026.9.1") from error

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "structures" / "variants"
WIDTH, HEIGHT = 480, 360
COLORS = {6: "#586575", 7: "#2867bc", 8: "#c9434c", 16: "#b48a16", 34: "#bf6923"}
PALETTE = {number: tuple(int(color[i:i+2], 16)/255 for i in (1, 3, 5))
           for number, color in COLORS.items()}
PALETTE[6] = (.12, .16, .22)


def clean_svg(svg):
    svg = re.sub(r"<\?xml.*?\?>|<!--.*?-->|<metadata.*?</metadata>", "", svg, flags=re.S)
    if "viewBox=" not in svg:
        svg = svg.replace("<svg", f'<svg viewBox="0 0 {WIDTH} {HEIGHT}"', 1)
    # RDKit's atom/bond classes contain indices only, never chemical identifiers.
    return svg.strip() + "\n"


def flat_svg(molecule, style):
    mol = Chem.Mol(molecule)
    rdDepictor.Compute2DCoords(mol)
    if style == "rotated":
        angle = math.radians(65)
        conf = mol.GetConformer()
        for i in range(mol.GetNumAtoms()):
            p = conf.GetAtomPosition(i)
            conf.SetAtomPosition(i, Point3D(p.x*math.cos(angle)-p.y*math.sin(angle),
                                            p.x*math.sin(angle)+p.y*math.cos(angle), 0))
    drawer = rdMolDraw2D.MolDraw2DSVG(WIDTH, HEIGHT)
    options = drawer.drawOptions()
    options.padding = .09
    options.bondLineWidth = 2.5
    options.minFontSize = 23
    options.maxFontSize = 30
    options.updateAtomPalette(PALETTE)
    options.includeMetadata = False
    if style == "explicit":
        for atom in mol.GetAtoms():
            if atom.GetAtomicNum() == 6:
                h = atom.GetTotalNumHs()
                options.atomLabels[atom.GetIdx()] = "C" + ("H" + (f"<sub>{h}</sub>" if h > 1 else "") if h else "")
    rdMolDraw2D.PrepareAndDrawMolecule(drawer, mol)
    drawer.FinishDrawing()
    return clean_svg(drawer.GetDrawingText())


def conformer(molecule):
    mol = Chem.AddHs(molecule)
    params = AllChem.ETKDGv3()
    params.randomSeed = 1947
    params.numThreads = 1
    if AllChem.EmbedMolecule(mol, params) != 0:
        params.useRandomCoords = True
        if AllChem.EmbedMolecule(mol, params) != 0:
            raise RuntimeError("3D embedding failed")
    if AllChem.MMFFHasAllMoleculeParams(mol):
        AllChem.MMFFOptimizeMolecule(mol, maxIters=1000)
    elif AllChem.UFFHasAllMoleculeParams(mol):
        AllChem.UFFOptimizeMolecule(mol, maxIters=1000)
    mol = Chem.RemoveHs(mol)
    # Verify that geometry still encodes the input's stereochemistry.
    check = Chem.Mol(mol)
    Chem.AssignAtomChiralTagsFromStructure(check, replaceExistingTags=True)
    Chem.AssignStereochemistry(check, cleanIt=True, force=True)
    if Chem.MolToSmiles(check) != Chem.MolToSmiles(molecule):
        raise RuntimeError("Generated conformer changed stereochemistry")
    coords = np.asarray(mol.GetConformer().GetPositions())
    coords -= coords.mean(axis=0)
    Chem.Kekulize(mol, clearAromaticFlags=True)
    return mol, coords


def crossing(a, b, c, d):
    def orient(x, y, z):
        u, v = y-x, z-x
        return u[0]*v[1]-u[1]*v[0]
    return orient(a, b, c)*orient(a, b, d) < 0 and orient(c, d, a)*orient(c, d, b) < 0


def view_score(points, bonds):
    xy = points[:, :2]
    neighbors = {tuple(sorted((i, j))) for i, j, _ in bonds}
    score = 0.
    for i in range(len(points)):
        for j in range(i):
            distance = np.linalg.norm(xy[i]-xy[j])
            minimum = .85 if (j, i) in neighbors else .95
            score += max(0, minimum-distance)**2 * 30
    for n, (i, j, _) in enumerate(bonds):
        for k, l, _ in bonds[:n]:
            if len({i, j, k, l}) == 4 and crossing(xy[i], xy[j], xy[k], xy[l]):
                score += 3
    extent = np.ptp(xy, axis=0)
    # Prefer views that use the phone's image area instead of a narrow strip.
    score += max(0, extent[0]/max(extent[1], .01)-1.8)*2
    score += max(0, extent[1]/max(extent[0], .01)-1.1)*2
    return score


def cameras(coords, bonds):
    rng = np.random.default_rng(143)
    choices = []
    for _ in range(180):
        rotation, _ = np.linalg.qr(rng.normal(size=(3, 3)))
        if np.linalg.det(rotation) < 0:
            rotation[:, 0] *= -1
        projected = coords @ rotation
        choices.append((view_score(projected, bonds), rotation, projected))
    choices.sort(key=lambda value: value[0])
    first = choices[0]
    second = next(value for value in choices[1:]
                  if np.dot(value[1][:, 2], first[1][:, 2]) < math.cos(math.radians(50)))
    return first[2], second[2]


def ball_svg(mol, points, bonds):
    points = points.copy()
    extent = np.ptp(points[:, :2], axis=0)
    scale = min((WIDTH-80)/max(extent[0], 1), (HEIGHT-80)/max(extent[1], 1), 64)
    center = (points[:, :2].max(axis=0)+points[:, :2].min(axis=0))/2
    points[:, :2] = (points[:, :2]-center)*scale
    points[:, 0] += WIDTH/2
    points[:, 1] = HEIGHT/2-points[:, 1]
    radius = min(14., scale*.23)
    shapes = []
    gradients = []
    for number, color in COLORS.items():
        gradients.append(f'<radialGradient id="a{number}" cx="32%" cy="25%" r="75%">'
                         f'<stop offset="0" stop-color="#fff"/><stop offset=".35" stop-color="{color}"/>'
                         f'<stop offset="1" stop-color="{color}"/></radialGradient>')
    for i, j, order in bonds:
        a, b = points[i], points[j]
        delta = b[:2]-a[:2]
        length = float(np.linalg.norm(delta))
        normal = np.array([-delta[1], delta[0]])/max(length, .01)
        unit = delta/max(length, .01)
        offsets = [-3.4, 3.4] if order == 2 else [-5., 0., 5.] if order == 3 else [0.]
        for offset in offsets:
            ra = radius*(1 if mol.GetAtomWithIdx(i).GetAtomicNum() == 6 else 1.12)
            rb = radius*(1 if mol.GetAtomWithIdx(j).GetAtomicNum() == 6 else 1.12)
            # Clip projected rods at each sphere, so a nearer bond segment
            # cannot paint across the atom symbol on the sphere's front.
            trim_a = math.sqrt(max(0, ra*ra-offset*offset))*.92
            trim_b = math.sqrt(max(0, rb*rb-offset*offset))*.92
            start = a[:2]+normal*offset+unit*min(trim_a, length*.4)
            end = b[:2]+normal*offset-unit*min(trim_b, length*.4)
            for segment in range(6):
                t0, t1 = segment/6, (segment+1)/6
                x, y = start+(end-start)*t0, start+(end-start)*t1
                z = a[2]+(b[2]-a[2])*(t0+t1)/2
                shapes.append((z, f'<path d="M{x[0]:.2f},{x[1]:.2f} L{y[0]:.2f},{y[1]:.2f}" '
                                  'stroke="#8995a3" stroke-width="5" stroke-linecap="round"/>'))
    for atom, point in zip(mol.GetAtoms(), points):
        number, symbol = atom.GetAtomicNum(), atom.GetSymbol()
        color = COLORS.get(number, "#586575")
        r = radius if number == 6 else radius*1.12
        shape = (f'<circle cx="{point[0]:.2f}" cy="{point[1]:.2f}" r="{r:.2f}" '
                 f'fill="url(#a{number})" stroke="{color}" stroke-width="1"/>')
        if number != 6:
            # Visible letters keep the exercise usable without colour perception.
            shape += (f'<text x="{point[0]:.2f}" y="{point[1]+.4:.2f}" text-anchor="middle" '
                      f'dominant-baseline="central" fill="white" font-family="Arial,sans-serif" '
                      f'font-size="{r*1.3:.2f}" font-weight="bold">{symbol}</text>')
        shapes.append((point[2]+.01, shape))
    shapes.sort(key=lambda value: value[0])
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{WIDTH}" height="{HEIGHT}" '
            f'viewBox="0 0 {WIDTH} {HEIGHT}"><rect width="100%" height="100%" fill="white"/>'
            '<defs>'+''.join(gradients)+'</defs>'+''.join(shape for _, shape in shapes)+'</svg>\n')


def save(svg):
    name = hashlib.sha256(svg.encode()).hexdigest()[:24]+".svg"
    (OUT/name).write_text(svg, encoding="utf-8", newline="\n")
    return (OUT/name).relative_to(ROOT).as_posix()


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    manifest = {"version": 1, "molecules": {}}
    for entry in json.loads((ROOT/"content/amino/core.json").read_text(encoding="utf-8")):
        molecule = Chem.MolFromSmiles(entry["smiles"])
        if molecule is None:
            raise ValueError("Invalid input SMILES: "+entry["code"])
        variants = {style: save(flat_svg(molecule, style)) for style in ["skeletal", "rotated", "explicit"]}
        mol, xyz = conformer(molecule)
        bonds = [(b.GetBeginAtomIdx(), b.GetEndAtomIdx(), int(b.GetBondTypeAsDouble())) for b in mol.GetBonds()]
        for style, points in zip(["ball", "ball-alt"], cameras(xyz, bonds)):
            variants[style] = save(ball_svg(mol, points, bonds))
        manifest["molecules"][entry["code"]] = variants
        print(entry["code"], rdMolDescriptors.CalcMolFormula(molecule), "5 views", flush=True)
    destination = ROOT/"content/structures.json"
    temporary = destination.with_suffix(".json.tmp")
    temporary.write_text(json.dumps(manifest, indent=2)+"\n", encoding="utf-8")
    temporary.replace(destination)
    print("Wrote 110 SVGs and content/structures.json")


if __name__ == "__main__":
    main()
