import * as THREE from 'three';

// ---------------------------------------------------------------------------
// Palette — bright, clean, isometric-studio look (white world + Purolator blue)
// ---------------------------------------------------------------------------
export const C = {
  ground:    0xe4eaf3,
  plate:     0xeff3fa,
  road:      0xd9e1ee,
  roadLine:  0xffffff,
  white:     0xf6f9fd,
  whiteWarm: 0xf1f4f9,
  glass:     0x8fa6c9,
  navy:      0x232c40,
  navyDeep:  0x1a2233,
  puroBlue:  0x1c4fc4,
  puroBlueDark: 0x10307c,
  puroRed:   0xe3172e,
  orange:    0xf2803a,
  skin:      0xe8b08a,
  belt:      0x9aa4b5,
  beltDark:  0x6f7889,
  steel:     0xb9c2d1,
  box:       0xd9b98c,
  boxLight:  0xe6cba3,
  wheel:     0x1c2333,
  hub:       0x3d4a66,
};

const matCache = new Map();

/** Cached flat-shaded standard material. */
export function mat(color, { roughness = 0.88, metalness = 0.0, emissive = 0x000000 } = {}) {
  const key = `${color}|${roughness}|${metalness}|${emissive}`;
  if (!matCache.has(key)) {
    matCache.set(key, new THREE.MeshStandardMaterial({ color, roughness, metalness, emissive }));
  }
  return matCache.get(key);
}

/** Box mesh helper with shadows on. */
export function box(w, h, d, material, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

/** Cylinder mesh helper. */
export function cyl(rTop, rBot, h, material, x = 0, y = 0, z = 0, seg = 20) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, h, seg), material);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

/** Rounded-rectangle extruded plate (for ground districts / pads). */
export function roundedPlate(w, d, h, r, material) {
  const shape = new THREE.Shape();
  const x = -w / 2, y = -d / 2;
  shape.moveTo(x + r, y);
  shape.lineTo(x + w - r, y);
  shape.quadraticCurveTo(x + w, y, x + w, y + r);
  shape.lineTo(x + w, y + d - r);
  shape.quadraticCurveTo(x + w, y + d, x + w - r, y + d);
  shape.lineTo(x + r, y + d);
  shape.quadraticCurveTo(x, y + d, x, y + d - r);
  shape.lineTo(x, y + r);
  shape.quadraticCurveTo(x, y, x + r, y);
  const geo = new THREE.ExtrudeGeometry(shape, { depth: h, bevelEnabled: false });
  geo.rotateX(-Math.PI / 2);
  const mesh = new THREE.Mesh(geo, material);
  mesh.castShadow = false;
  mesh.receiveShadow = true;
  return mesh;
}

// ---------------------------------------------------------------------------
// Canvas text textures (signs, truck branding)
// ---------------------------------------------------------------------------
export function textTexture({
  text,
  sub = null,
  bg = '#1c4fc4',
  fg = '#ffffff',
  accent = null,
  w = 1024,
  h = 384,
  fontSize = 130,
  weight = 800,
}) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = fg;
  ctx.font = `${weight} ${fontSize}px Inter, -apple-system, "Helvetica Neue", Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, w / 2, sub ? h / 2 - fontSize * 0.28 : h / 2);

  if (sub) {
    ctx.font = `600 ${fontSize * 0.38}px Inter, -apple-system, Arial, sans-serif`;
    ctx.fillText(sub, w / 2, h / 2 + fontSize * 0.55);
  }

  if (accent) {
    // small accent chevron under the wordmark (nod to the Purolator leaf/flash)
    ctx.fillStyle = accent;
    const cw = fontSize * 0.5;
    const cx = w / 2 + ctx.measureText(text).width; // rough right side
    ctx.beginPath();
    ctx.moveTo(w / 2 - cw / 2, h - 46);
    ctx.lineTo(w / 2 + cw / 2, h - 46);
    ctx.lineTo(w / 2, h - 16);
    ctx.closePath();
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 4;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Material with branded text on an otherwise flat colour. */
export function brandedMaterial(opts) {
  return new THREE.MeshStandardMaterial({
    map: textTexture(opts),
    roughness: 0.85,
    metalness: 0,
  });
}
