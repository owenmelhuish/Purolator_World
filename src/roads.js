import * as THREE from 'three';
import { C, mat, box, roundedPlate } from './materials.js';

export const ROAD_COORDS = [-105, -35, 35, 105]; // grid lines on both axes
export const WORLD = 250;
const ROAD_W = 9;
const ROAD_Y = 0.06;
const DASH_Y = 0.1;

/** Build ground plate, district plates and the road grid. */
export function buildGround(scene) {
  // base world plate (rounded, floating look)
  const base = roundedPlate(WORLD, WORLD, 2.4, 10, mat(C.ground));
  base.position.y = -2.4;
  scene.add(base);

  // subtle district plates inside each block
  const blockCenters = [-70, 0, 70];
  for (const bx of blockCenters) {
    for (const bz of blockCenters) {
      const plate = roundedPlate(58, 58, 0.5, 5, mat(C.plate));
      plate.position.set(bx, -0.46, bz);
      scene.add(plate);
    }
  }

  // roads — full-length strips both directions
  const roadMat = mat(C.road, { roughness: 0.98 });
  for (const c of ROAD_COORDS) {
    const h = box(WORLD, 0.12, ROAD_W, roadMat, 0, ROAD_Y, c);
    h.castShadow = false;
    scene.add(h);
    const v = box(ROAD_W, 0.12, WORLD, roadMat, c, ROAD_Y, 0);
    v.castShadow = false;
    scene.add(v);
  }

  // zebra crossings at the four inner intersections
  const zebraMat = mat(C.roadLine, { roughness: 0.9 });
  for (const ix of [-35, 35]) {
    for (const iz of [-35, 35]) {
      for (let s = -1; s <= 1; s += 2) {
        for (let k = -2; k <= 2; k++) {
          // crossing the horizontal road (stripes along x)
          const st1 = box(0.55, 0.045, 2.6, zebraMat, ix + k * 1.15, DASH_Y, iz + s * (ROAD_W / 2 + 1.9));
          st1.castShadow = false;
          scene.add(st1);
          // crossing the vertical road (stripes along z)
          const st2 = box(2.6, 0.045, 0.55, zebraMat, ix + s * (ROAD_W / 2 + 1.9), DASH_Y, iz + k * 1.15);
          st2.castShadow = false;
          scene.add(st2);
        }
      }
    }
  }

  // centre dashes
  const dashMat = mat(C.roadLine, { roughness: 0.9 });
  const dashLen = 2.2, gap = 3.4;
  for (const c of ROAD_COORDS) {
    for (let x = -WORLD / 2 + 4; x < WORLD / 2 - 4; x += dashLen + gap) {
      // skip dashes inside intersections
      if (ROAD_COORDS.some((rc) => Math.abs(x + dashLen / 2 - rc) < ROAD_W / 2 + 1)) continue;
      const dh = box(dashLen, 0.04, 0.28, dashMat, x + dashLen / 2, DASH_Y, c);
      dh.castShadow = false;
      scene.add(dh);
      const dv = box(0.28, 0.04, dashLen, dashMat, c, DASH_Y, x + dashLen / 2);
      dv.castShadow = false;
      scene.add(dv);
    }
  }
}

/**
 * Rounded-rectangle loop for vehicles, sampled to dense points.
 * Rect defined by road centrelines; `laneOffset` shifts outward (+) or inward (-).
 */
export function roadLoop(x0, x1, z0, z1, laneOffset = 2, cornerR = 6) {
  const minX = Math.min(x0, x1) - laneOffset;
  const maxX = Math.max(x0, x1) + laneOffset;
  const minZ = Math.min(z0, z1) - laneOffset;
  const maxZ = Math.max(z0, z1) + laneOffset;
  const r = cornerR;
  const pts = [];
  const arc = (cx, cz, a0, a1) => {
    const steps = 6;
    for (let i = 0; i <= steps; i++) {
      const a = a0 + ((a1 - a0) * i) / steps;
      pts.push(new THREE.Vector3(cx + Math.cos(a) * r, 0, cz + Math.sin(a) * r));
    }
  };
  // clockwise (viewed from above, +x right +z down)
  pts.push(new THREE.Vector3(minX + r, 0, minZ));
  pts.push(new THREE.Vector3(maxX - r, 0, minZ));
  arc(maxX - r, minZ + r, -Math.PI / 2, 0);
  pts.push(new THREE.Vector3(maxX, 0, maxZ - r));
  arc(maxX - r, maxZ - r, 0, Math.PI / 2);
  pts.push(new THREE.Vector3(minX + r, 0, maxZ));
  arc(minX + r, maxZ - r, Math.PI / 2, Math.PI);
  pts.push(new THREE.Vector3(minX, 0, minZ + r));
  arc(minX + r, minZ + r, Math.PI, Math.PI * 1.5);
  return pts;
}
