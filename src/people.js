import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import { dirFromLatLon, CirclePath, pathPlace, R } from './globe.js';

// ---------------------------------------------------------------------------
// Every human in the world is the stratis-marketing-team character.glb,
// cloned, painted plain white, and animated. Figures are requested
// synchronously during scene construction (placeholder groups) and filled
// once the model loads.
// ---------------------------------------------------------------------------

let baseScene = null;
let clips = null;
const pending = [];
const mixers = [];
const faces = [];
const whiteM = new THREE.MeshStandardMaterial({ color: 0xf3f6fb, roughness: 0.55 });

const STAND_CLIPS = ['Idle', 'Talk', 'LookAround', 'Happy', 'Listen'];

// --- expression atlas (2 cols × 4 rows, same layout as stratis-marketing-team)
const CELL = (col, row) => [col / 2, 1 - (row + 1) / 4];
const IDLE_EYES = CELL(0, 3);
const BLINK_EYES = CELL(1, 3);
const IDLE_MOUTH = CELL(1, 3);
const SPEAK_MOUTH = [CELL(1, 3), CELL(0, 3), CELL(1, 2), CELL(0, 2)];

function fillFigure(group, opts) {
  const obj = SkeletonUtils.clone(baseScene);
  // eyes + mouth keep their atlas textures (cloned so each figure can blink
  // and talk independently); everything else renders plain white
  const face = {
    eyes: null, mouth: null,
    blinkT: 1.5 + Math.random() * 4, blinking: false,
    speaking: false, speakT: 0, frame: 0,
  };
  obj.traverse((o) => {
    if (o.isMesh || o.isSkinnedMesh) {
      const nm = (o.name || '').toLowerCase();
      if (nm.includes('eyes') || nm.includes('mouth')) {
        const m = o.material.clone();
        m.map = m.map.clone();
        m.map.needsUpdate = true;
        m.transparent = true;
        m.depthWrite = false;
        m.polygonOffset = true;
        m.polygonOffsetFactor = -1;
        m.polygonOffsetUnits = -1;
        o.material = m;
        o.renderOrder = 1;
        o.castShadow = false;
        if (nm.includes('eyes')) {
          face.eyes = m.map;
          m.map.offset.set(IDLE_EYES[0], IDLE_EYES[1]);
        } else {
          face.mouth = m.map;
          m.map.offset.set(IDLE_MOUTH[0], IDLE_MOUTH[1]);
        }
      } else {
        o.material = whiteM;
        o.castShadow = true;
      }
      o.frustumCulled = false; // skinned bounds are unreliable on a sphere
    }
  });
  group.userData.face = face;
  faces.push(face);
  obj.rotation.y = Math.PI / 2;          // model faces +Z; world convention is +X
  obj.scale.setScalar(opts.scale ?? 1.06);
  if (opts.seated) obj.position.y = -0.04;
  group.add(obj);

  const mixer = new THREE.AnimationMixer(obj);
  let name = opts.clip;
  if (!name) {
    name = opts.seated
      ? (Math.random() < 0.7 ? 'Sit_Work' : 'Sit_Idle')
      : STAND_CLIPS[Math.floor(Math.random() * STAND_CLIPS.length)];
  }
  const clip = clips.find((c) => c.name === name) ?? clips[0];
  const action = mixer.clipAction(clip);
  action.timeScale = opts.timeScale ?? 1;
  action.play();
  action.time = Math.random() * clip.duration;
  mixers.push(mixer);
}

/**
 * Get a person immediately (fills with the animated GLB once loaded).
 * opts: { seated, clip, scale } — everything renders plain white.
 */
export function requestFigure(opts = {}) {
  const group = new THREE.Group();
  if (baseScene) fillFigure(group, opts);
  else pending.push([group, opts]);
  return group;
}

// --- wandering pedestrians --------------------------------------------------
const WALKERS = [
  // plaza park around the tower
  { lat: 76, lon: 42, r: 3.8, alt: 0.34, speed: 1.1 },
  { lat: 75, lon: -58, r: 3.2, alt: 0.34, speed: 0.95, reverse: true },
  { lat: 77, lon: 150, r: 3.4, alt: 0.34, speed: 1.05 },
  // around the pavilion plaza
  { lat: 24, lon: 27, r: 4.0, alt: 0.4, speed: 1.0, reverse: true },
  { lat: 31, lon: 13, r: 3.2, alt: 0.4, speed: 0.9 },
  // office fronts
  { lat: 52, lon: -46, r: 3.4, alt: 0.38, speed: 1.0 },
  { lat: 52, lon: 61, r: 3.0, alt: 0.35, speed: 0.92, reverse: true },
  { lat: 52.5, lon: 109, r: 3.4, alt: 0.37, speed: 1.05 },
  // southern hemisphere
  { lat: -49, lon: 92, r: 3.5, alt: 0.38, speed: 1.0, reverse: true },
  { lat: -77, lon: 55, r: 3.0, alt: 0.34, speed: 0.95 },
  { lat: -54, lon: -64, r: 2.8, alt: 0.35, speed: 1.0 },
  // rail yard + back-hemisphere districts
  { lat: 20, lon: 42, r: 2.8, alt: 0.4, speed: 1.0 },
  { lat: 21.5, lon: -176, r: 3.0, alt: 0.38, speed: 0.9, reverse: true },
  // city neighbourhoods — sidewalk loops around the blocks, some in a hurry
  { lat: 27, lon: -1, r: 4.0, alt: 0.26, speed: 1.7, ts: 1.55 },
  { lat: -22, lon: 7, r: 4.5, alt: 0.26, speed: 1.0 },
  { lat: -22, lon: 58, r: 4.5, alt: 0.26, speed: 1.8, ts: 1.6, reverse: true },
  { lat: -22, lon: -55, r: 4.5, alt: 0.26, speed: 1.05 },
  { lat: 19, lon: 130, r: 4.4, alt: 0.26, speed: 0.95, reverse: true },
  // (walker at -16/165 removed — its loop crossed under the ZeroWaste plinth)
  { lat: -22, lon: -163, r: 4.5, alt: 0.26, speed: 1.0 },
  { lat: -49, lon: -124, r: 4.4, alt: 0.26, speed: 0.9, reverse: true },
  { lat: 13, lon: 99, r: 4.4, alt: 0.26, speed: 1.75, ts: 1.55 },
];

function spawnWalkers(scene, animators) {
  for (const w of WALKERS) {
    const rig = new THREE.Group();
    rig.userData.noWalk = true; // moving — never walkable ground in FP mode
    rig.add(requestFigure({ clip: 'Walk', scale: 1.12, timeScale: w.ts ?? 1 }));
    scene.add(rig);
    const path = new CirclePath(dirFromLatLon(w.lat, w.lon), w.r / R, w.alt);
    let t = Math.random();
    const dirSign = w.reverse ? -1 : 1;
    animators.push({
      update(dt) {
        t = ((t + (dirSign * dt * w.speed) / path.length) % 1 + 1) % 1;
        pathPlace(rig, path, t);
        if (w.reverse) rig.rotateY(Math.PI);
      },
    });
  }
}

/** Load the character, fill all requested figures, start walkers + mixers. */
export async function initPeople(scene, animators) {
  const loader = new GLTFLoader();
  const draco = new DRACOLoader();
  draco.setDecoderPath('/draco/');
  loader.setDRACOLoader(draco);
  const gltf = await loader.loadAsync('/character.glb');
  baseScene = gltf.scene;
  clips = gltf.animations;

  for (const [g, o] of pending) fillFigure(g, o);
  pending.length = 0;

  spawnWalkers(scene, animators);
  animators.push({
    update(dt) {
      for (const m of mixers) m.update(dt);
      for (const f of faces) {
        if (!f.eyes) continue;
        // blink
        f.blinkT -= dt;
        if (f.blinkT <= 0) {
          f.blinking = !f.blinking;
          f.blinkT = f.blinking ? 0.12 : 2.4 + Math.random() * 3.6;
          const c = f.blinking ? BLINK_EYES : IDLE_EYES;
          f.eyes.offset.set(c[0], c[1]);
        }
        // talking mouth (driven by the NPC bubble system)
        if (f.speaking) {
          f.speakT -= dt;
          if (f.speakT <= 0) {
            f.speakT = 0.14;
            f.frame = (f.frame + 1) % SPEAK_MOUTH.length;
            f.mouth.offset.set(SPEAK_MOUTH[f.frame][0], SPEAK_MOUTH[f.frame][1]);
          }
        } else if (f.frame !== 0) {
          f.frame = 0;
          f.mouth.offset.set(IDLE_MOUTH[0], IDLE_MOUTH[1]);
        }
      }
    },
  });
}
