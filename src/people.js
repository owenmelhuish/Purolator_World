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
const whiteM = new THREE.MeshStandardMaterial({ color: 0xf3f6fb, roughness: 0.55 });

const STAND_CLIPS = ['Idle', 'Talk', 'LookAround', 'Happy', 'Listen'];

function fillFigure(group, opts) {
  const obj = SkeletonUtils.clone(baseScene);
  obj.traverse((o) => {
    if (o.isMesh || o.isSkinnedMesh) {
      o.material = whiteM;
      o.castShadow = true;
      o.frustumCulled = false; // skinned bounds are unreliable on a sphere
    }
  });
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
  { lat: 76, lon: 42, r: 4.2, alt: 0.34, speed: 1.1 },
  { lat: 75, lon: -58, r: 4.8, alt: 0.34, speed: 0.95, reverse: true },
  { lat: 77, lon: 150, r: 3.4, alt: 0.34, speed: 1.05 },
  // around the pavilion plaza
  { lat: 24, lon: 27, r: 4.0, alt: 0.4, speed: 1.0, reverse: true },
  { lat: 31, lon: 13, r: 3.2, alt: 0.4, speed: 0.9 },
  // office fronts
  { lat: 50, lon: -46, r: 3.4, alt: 0.38, speed: 1.0 },
  { lat: 50.5, lon: 61, r: 3.0, alt: 0.35, speed: 0.92, reverse: true },
  { lat: 49, lon: 109, r: 3.8, alt: 0.37, speed: 1.05 },
  // port quay
  { lat: 27, lon: -66, r: 3.2, alt: 0.39, speed: 0.9 },
  // southern hemisphere
  { lat: -45, lon: 90, r: 3.8, alt: 0.38, speed: 1.0, reverse: true },
  { lat: -77, lon: 55, r: 3.0, alt: 0.34, speed: 0.95 },
  { lat: -42, lon: -55, r: 3.2, alt: 0.35, speed: 1.0 },
  // back-hemisphere districts
  { lat: 49, lon: 172, r: 3.2, alt: 0.36, speed: 1.0 },
  { lat: 21.5, lon: -176, r: 3.0, alt: 0.38, speed: 0.9, reverse: true },
];

function spawnWalkers(scene, animators) {
  for (const w of WALKERS) {
    const rig = new THREE.Group();
    rig.add(requestFigure({ clip: 'Walk', scale: 1.12 }));
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
    },
  });
}
