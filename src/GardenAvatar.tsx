import { useEffect, useMemo, useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { SkeletonUtils } from "three-stdlib";
import * as THREE from "three";
import { normalizeAvatarStyle, type AvatarStyle } from "./game/avatars";

export type AvatarMotion = {
  speed: number;
  action: "idle" | "walk" | "work" | "water" | "feed" | "bond" | "wave";
  waterTarget?: [number, number, number];
};
const hairFiles = {
  long: "long",
  short: "simpleparted",
  bun: "buns",
  "close-cropped": "buzzedfemale",
  ponytail: "long",
  bald: "buzzedfemale",
};

/** The licensed character mesh is skinned to one skeleton. Clothes use the same weights. */
export function GardenAvatar({
  appearance,
  motion,
  floralShorts = false,
}: {
  appearance: AvatarStyle;
  motion?: RefObject<AvatarMotion>;
  floralShorts?: boolean;
}) {
  const style = useMemo(() => normalizeAvatarStyle(appearance), [appearance]);
  const masculine = style.bodyFrame !== "feminine";
  const base = useGLTF(
    `/models/characters/${masculine ? "male" : "female"}.glb`,
  );
  const hair = useGLTF(
    `/models/characters/hair-${hairFiles[style.hairStyle]}.glb`,
  );
  const phase = useRef(0);
  const rig = useMemo(() => {
    const scene = SkeletonUtils.clone(base.scene);
    const bones: Record<string, THREE.Bone> = {},
      rest: Record<string, THREE.Quaternion> = {},
      parentRest: Record<string, THREE.Quaternion> = {};
    const ownedMaterials: THREE.Material[] = [],
      ownedGeometry: THREE.BufferGeometry[] = [];
    scene.updateMatrixWorld(true);
    scene.traverse((o) => {
      if (o instanceof THREE.Bone) {
        bones[o.name] = o;
        rest[o.name] = o.quaternion.clone();
        parentRest[o.name] = o.parent!.getWorldQuaternion(
          new THREE.Quaternion(),
        );
      }
    });
    const skin = new THREE.MeshStandardMaterial({
      color: style.skin,
      roughness: 0.68,
    });
    const top = new THREE.MeshStandardMaterial({
      color: style.clothing,
      roughness: 0.93,
    });
    const bottom = new THREE.MeshStandardMaterial({
      color: style.pants,
      roughness: 0.94,
    });
    const shoe = new THREE.MeshStandardMaterial({
      color: style.shoes,
      roughness: 0.8,
    });
    const hairMat = new THREE.MeshStandardMaterial({
      color: style.hair,
      roughness: 0.72,
    });
    ownedMaterials.push(skin, top, bottom, shoe, hairMat);
    scene.traverse((o) => {
      if (!(o instanceof THREE.Mesh)) return;
      o.castShadow = o.receiveShadow = true;
      o.frustumCulled = false;
      if (o.name.includes("Eyebrow")) {
        o.material = hairMat;
        return;
      }
      if (o.name.includes("Eye")) {
        const material = (o.material as THREE.MeshStandardMaterial).clone();
        material.roughness = 0.32;
        material.onBeforeCompile = (shader) => {
          shader.uniforms.irisColor = { value: new THREE.Color(style.eyes) };
          shader.fragmentShader =
            "uniform vec3 irisColor;\n" + shader.fragmentShader;
          shader.fragmentShader = shader.fragmentShader.replace(
            "#include <map_fragment>",
            `#include <map_fragment>\nfloat iris = 1.0-smoothstep(0.12,0.48,diffuseColor.g);\ndiffuseColor.rgb=mix(diffuseColor.rgb,irisColor*(0.25+diffuseColor.r*1.8),iris);`,
          );
        };
        material.customProgramCacheKey = () => `garden-eyes-${style.eyes}`;
        o.material = material;
        ownedMaterials.push(material);
        return;
      }
      // Smooth garment boundaries are evaluated across triangles, avoiding a sawtooth neckline.
      const geo = o.geometry.clone();
      const material = skin.clone();
      material.onBeforeCompile = (shader) => {
        Object.assign(shader.uniforms, {
          gardenTop: { value: new THREE.Color(style.clothing) },
          gardenBottom: { value: new THREE.Color(style.pants) },
          gardenShoe: { value: new THREE.Color(style.shoes) },
        });
        shader.vertexShader =
          "varying vec3 gardenRest;\n" + shader.vertexShader;
        shader.vertexShader = shader.vertexShader.replace(
          "#include <begin_vertex>",
          "#include <begin_vertex>\ngardenRest = position;",
        );
        shader.fragmentShader =
          "varying vec3 gardenRest; uniform vec3 gardenTop; uniform vec3 gardenBottom; uniform vec3 gardenShoe;\n" +
          shader.fragmentShader;
        shader.fragmentShader = shader.fragmentShader.replace(
          "#include <color_fragment>",
          `#include <color_fragment>
          float x=abs(gardenRest.x)/${masculine ? "1.1" : "1.0"}, y=gardenRest.y/${masculine ? "1.035" : "1.0"}, z=gardenRest.z;
          float neck = ${style.topStyle === "tank" ? "1.355" : "1.43 + .045*smoothstep(.035,.09,x)"};
          if(z<0.0) neck=${style.topStyle === "tank" ? 1.355 : 1.48};
          bool shirt = y>1.015 && y<neck && x<${style.topStyle === "long-sleeve" ? 0.63 : style.topStyle === "tee" ? 0.32 : 0.18};
          bool pants = y<=1.025 && y>${style.bottomStyle === "trousers" ? 0.095 : style.bottomStyle === "shorts" ? 0.68 : 0.87};
          bool shoes = y<${style.footwear === "boots" ? 0.22 : style.footwear === "trainers" ? 0.095 : -0.1};
          if(shirt) diffuseColor.rgb=gardenTop;
          if(pants) diffuseColor.rgb=gardenBottom;
          if(shoes) diffuseColor.rgb=gardenShoe;
        `,
        );
      };
      material.customProgramCacheKey = () =>
        `wardrobe-${style.topStyle}-${style.bottomStyle}-${style.footwear}-${style.clothing}-${style.pants}-${style.shoes}`;
      o.geometry = geo;
      o.material = material;
      ownedGeometry.push(geo);
      ownedMaterials.push(material);
    });
    // A separate cloth shell gives the shirt ease over the body instead of painted-on anatomy.
    let sourceBody: THREE.SkinnedMesh | undefined;
    scene.traverse((o) => {
      if (
        o instanceof THREE.SkinnedMesh &&
        o.name.toLowerCase().includes("superhero")
      )
        sourceBody = o;
    });
    if (sourceBody) {
      const body = sourceBody as THREE.SkinnedMesh,
        sourceP = body.geometry.getAttribute("position"),
        sourceJ = body.geometry.getAttribute("skinIndex"),
        sourceW = body.geometry.getAttribute("skinWeight");
      const vertices: number[] = [],
        indices: number[] = [],
        joints: number[] = [],
        weights: number[] = [];
      const add = (x: number, y: number, z: number) => {
        if (masculine) {
          x *= 1.1;
          y *= 1.035;
          z *= 1.08;
        }
        vertices.push(x, y, z);
        let nearest = 0,
          distance = Infinity;
        for (let i = 0; i < sourceP.count; i++) {
          const d =
            (sourceP.getX(i) - x) ** 2 +
            (sourceP.getY(i) - y) ** 2 +
            (sourceP.getZ(i) - z) ** 2;
          if (d < distance) {
            distance = d;
            nearest = i;
          }
        }
        for (let k = 0; k < 4; k++) {
          joints.push(sourceJ.getComponent(nearest, k));
          weights.push(sourceW.getComponent(nearest, k));
        }
      };
      const rows = [
        [1.01, 0.184, 0.105, 0.166],
        [1.075, 0.158, 0.11, 0.125],
        [1.15, 0.137, 0.115, 0.086],
        [1.23, 0.148, 0.135, 0.103],
        [1.3, 0.17, 0.155, 0.123],
        [1.355, 0.176, 0.158, 0.14],
      ];
      if (style.topStyle !== "tank")
        rows.push(
          [1.4, 0.21, 0.115, 0.14],
          [1.455, 0.14, 0.06, 0.12],
          [1.49, 0.067, 0.025, 0.09],
        );
      const segments = 48;
      rows.forEach(([y, rx, front, back], r) => {
        for (let j = 0; j <= segments; j++) {
          const a = (j / segments) * Math.PI * 2,
            sy = Math.sin(a);
          add(
            Math.cos(a) * rx,
            y,
            Math.sign(sy) *
              Math.pow(Math.abs(sy), 0.68) *
              (sy > 0 ? front : back),
          );
          if (r && j) {
            const c = r * (segments + 1) + j;
            indices.push(
              c,
              c - 1,
              c - segments - 2,
              c,
              c - segments - 2,
              c - segments - 1,
            );
          }
        }
      });
      if (style.topStyle === "tank")
        for (const sign of [-1, 1]) {
          const start = vertices.length / 3,
            curve = new THREE.CatmullRomCurve3([
              new THREE.Vector3(sign * 0.115, 1.35, 0.14),
              new THREE.Vector3(sign * 0.12, 1.435, 0.065),
              new THREE.Vector3(sign * 0.12, 1.485, -0.04),
              new THREE.Vector3(sign * 0.115, 1.4, -0.13),
              new THREE.Vector3(sign * 0.115, 1.35, -0.13),
            ]);
          for (let r = 0; r <= 20; r++) {
            const p = curve.getPoint(r / 20);
            for (const edge of [-1, 1]) add(p.x + edge * 0.018, p.y, p.z);
            if (r) {
              const c = start + r * 2;
              indices.push(c, c + 1, c - 1, c, c - 1, c - 2);
            }
          }
        }
      if (style.topStyle !== "tank")
        for (const sign of [-1, 1]) {
          const start = vertices.length / 3,
            steps = 24,
            length = style.topStyle === "long-sleeve" ? 0.62 : 0.33;
          const rings = [0.17, 0.205, length - 0.015, length];
          rings.forEach((x, r) => {
            for (let j = 0; j <= steps; j++) {
              const a = (j / steps) * Math.PI * 2,
                rad =
                  r < 2
                    ? 0.085
                    : style.topStyle === "long-sleeve"
                      ? 0.047
                      : 0.073;
              add(
                sign * x,
                1.405 + Math.cos(a) * rad,
                -0.02 + Math.sin(a) * rad,
              );
              if (r && j) {
                const c = start + r * (steps + 1) + j;
                indices.push(
                  c,
                  c - 1,
                  c - steps - 2,
                  c,
                  c - steps - 2,
                  c - steps - 1,
                );
              }
            }
          });
        }
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(vertices, 3),
      );
      geometry.setAttribute(
        "skinIndex",
        new THREE.Uint16BufferAttribute(joints, 4),
      );
      geometry.setAttribute(
        "skinWeight",
        new THREE.Float32BufferAttribute(weights, 4),
      );
      geometry.setIndex(indices);
      geometry.computeVertexNormals();
      top.side = THREE.DoubleSide;
      const garment = new THREE.SkinnedMesh(geometry, top);
      garment.name = "fitted-garden-shirt";
      garment.bind(body.skeleton, body.bindMatrix);
      garment.castShadow = garment.receiveShadow = true;
      garment.frustumCulled = false;
      scene.add(garment);
      ownedGeometry.push(geometry);
      if (style.bottomStyle !== "skirt") {
        vertices.length = indices.length = joints.length = weights.length = 0;
        const legRows =
          style.bottomStyle === "shorts"
            ? [
                [0.68, 0.095, 0.104],
                [0.72, 0.098, 0.106],
                [0.84, 0.101, 0.119],
                [0.94, 0.102, 0.127],
              ]
            : [
                [0.1, 0.068, 0.071],
                [0.16, 0.071, 0.076],
                [0.35, 0.077, 0.084],
                [0.53, 0.082, 0.09],
                [0.72, 0.094, 0.1],
                [0.84, 0.101, 0.119],
                [0.94, 0.102, 0.127],
              ];
        for (const sign of [-1, 1]) {
          const start = vertices.length / 3,
            steps = 32;
          legRows.forEach(([y, rx, rz], r) => {
            for (let j = 0; j <= steps; j++) {
              const a = (j / steps) * Math.PI * 2;
              add(sign * 0.111 + Math.cos(a) * rx, y, Math.sin(a) * rz - 0.028);
              if (r && j) {
                const c = start + r * (steps + 1) + j;
                indices.push(
                  c,
                  c - 1,
                  c - steps - 2,
                  c,
                  c - steps - 2,
                  c - steps - 1,
                );
              }
            }
          });
        }
        const pantsGeometry = new THREE.BufferGeometry();
        pantsGeometry.setAttribute(
          "position",
          new THREE.Float32BufferAttribute(vertices, 3),
        );
        pantsGeometry.setAttribute(
          "skinIndex",
          new THREE.Uint16BufferAttribute(joints, 4),
        );
        pantsGeometry.setAttribute(
          "skinWeight",
          new THREE.Float32BufferAttribute(weights, 4),
        );
        pantsGeometry.setIndex(indices);
        pantsGeometry.computeVertexNormals();
        bottom.side = THREE.DoubleSide;
        const pantsMesh = new THREE.SkinnedMesh(pantsGeometry, bottom);
        pantsMesh.name = "fitted-garden-bottom";
        pantsMesh.bind(body.skeleton, body.bindMatrix);
        pantsMesh.castShadow = pantsMesh.receiveShadow = true;
        pantsMesh.frustumCulled = false;
        scene.add(pantsMesh);
        ownedGeometry.push(pantsGeometry);
      }
    }
    // Static accessories attach in the rest pose, then inherit the correct joint transform.
    const attach = (bone: THREE.Bone, object: THREE.Object3D) => {
      scene.add(object);
      scene.updateMatrixWorld(true);
      bone.attach(object);
    };
    if (style.hairStyle !== "bald") {
      const locks = hair.scene.clone(true);
      locks.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          o.material = hairMat;
          o.castShadow = true;
        }
      });
      if (masculine) {
        locks.position.y = style.hairStyle === "short" ? 0 : 0.075;
        locks.scale.set(1.05, 1, 1.05);
      } else if (style.hairStyle === "short") locks.position.y = -0.065;
      if (style.hairStyle === "long" || style.hairStyle === "ponytail") {
        // Extend the professionally sculpted locks below the shoulders, keeping the scalp fitted.
        locks.traverse((o) => {
          if (o instanceof THREE.Mesh) {
            const g = o.geometry.clone(),
              p = g.getAttribute("position");
            for (let i = 0; i < p.count; i++) {
              const y = p.getY(i);
              if (y < 1.64) {
                const t = (1.64 - y) / 0.14;
                p.setY(i, y - t * 0.29);
                if (style.hairStyle === "ponytail") {
                  p.setX(i, p.getX(i) * 0.55);
                  p.setZ(i, p.getZ(i) - t * 0.04);
                }
              }
            }
            g.computeVertexNormals();
            o.geometry = g;
            ownedGeometry.push(g);
          }
        });
      }
      attach(bones.Head, locks);
    }
    if (style.bottomStyle === "skirt") {
      const points = [
        [0.315, 0.59],
        [0.302, 0.61],
        [0.265, 0.76],
        [0.215, 0.9],
        [0.179, 1.025],
      ].map(([r, y]) => new THREE.Vector2(r, y));
      const geo = new THREE.LatheGeometry(points, 64);
      const p = geo.attributes.position;
      for (let i = 0; i < p.count; i++) {
        const x = p.getX(i),
          z = p.getZ(i),
          a = Math.atan2(z, x),
          y = p.getY(i);
        const pleat = 1 + (Math.sin(a * 12) * 0.015 * (1.03 - y)) / 0.44;
        p.setXYZ(i, x * pleat, y, z * 0.88 * pleat - 0.025);
      }
      geo.computeVertexNormals();
      const skirt = new THREE.Mesh(geo, bottom);
      skirt.castShadow = skirt.receiveShadow = true;
      bottom.side = THREE.DoubleSide;
      attach(bones.pelvis, skirt);
      ownedGeometry.push(geo);
    }
    for (const side of ["l", "r"]) {
      const foot = bones[`foot_${side}`],
        footPos = foot.getWorldPosition(new THREE.Vector3()),
        sign = side === "l" ? 1 : -1;
      if (style.footwear === "flip-flops") {
        const sandal = new THREE.Group();
        sandal.position.set(footPos.x, 0.012, 0.06);
        const soleGeo = new THREE.SphereGeometry(1, 24, 12),
          sole = new THREE.Mesh(soleGeo, shoe);
        sole.scale.set(0.058, 0.014, 0.132);
        sandal.add(sole);
        ownedGeometry.push(soleGeo);
        for (const s of [-1, 1]) {
          const curve = new THREE.CatmullRomCurve3([
              new THREE.Vector3(s * 0.05, 0.05, -0.025),
              new THREE.Vector3(s * 0.025, 0.075, 0.03),
              new THREE.Vector3(0, 0.04, 0.09),
            ]),
            g = new THREE.TubeGeometry(curve, 12, 0.009, 8, false);
          sandal.add(new THREE.Mesh(g, shoe));
          ownedGeometry.push(g);
        }
        attach(foot, sandal);
      }
      if (style.footwear === "trainers" || style.footwear === "boots") {
        const footwear = new THREE.Group();
        footwear.position.set(footPos.x, 0, 0.045);
        const g = new THREE.SphereGeometry(1, 24, 16),
          upper = new THREE.Mesh(g, shoe);
        upper.position.y = 0.057;
        upper.scale.set(0.068, 0.06, 0.142);
        upper.castShadow = true;
        footwear.add(upper);
        ownedGeometry.push(g);
        const soleMat = new THREE.MeshStandardMaterial({
          color: "#d8d0bc",
          roughness: 0.9,
        });
        ownedMaterials.push(soleMat);
        const sole = new THREE.Mesh(g, soleMat);
        sole.position.y = 0.018;
        sole.scale.set(0.071, 0.018, 0.145);
        footwear.add(sole);
        if (style.footwear === "boots") {
          const cuffGeo = new THREE.CylinderGeometry(0.073, 0.08, 0.22, 24),
            cuff = new THREE.Mesh(cuffGeo, shoe);
          cuff.position.set(0, 0.17, -0.04);
          cuff.castShadow = true;
          footwear.add(cuff);
          ownedGeometry.push(cuffGeo);
        } else
          for (let i = 0; i < 3; i++) {
            const laceGeo = new THREE.TubeGeometry(
              new THREE.CatmullRomCurve3([
                new THREE.Vector3(-0.04, 0.103, 0.005 + i * 0.025),
                new THREE.Vector3(0, 0.115, 0.005 + i * 0.025),
                new THREE.Vector3(0.04, 0.103, 0.005 + i * 0.025),
              ]),
              8,
              0.0035,
              6,
              false,
            );
            footwear.add(new THREE.Mesh(laceGeo, soleMat));
            ownedGeometry.push(laceGeo);
          }
        attach(foot, footwear);
      }
      if (floralShorts && style.bottomStyle === "shorts") {
        const flowers = new THREE.Group(),
          petal = new THREE.MeshStandardMaterial({
            color: "#7b91a5",
            roughness: 1,
          });
        ownedMaterials.push(petal);
        for (let i = 0; i < 12; i++) {
          const g = new THREE.CircleGeometry(0.008, 5),
            m = new THREE.Mesh(g, petal);
          m.position.set(
            sign * (0.07 + (i % 3) * 0.026),
            0.75 + Math.floor(i / 3) * 0.045,
            0.117,
          );
          flowers.add(m);
          ownedGeometry.push(g);
        }
        attach(bones[`thigh_${side}`], flowers);
      }
    }
    let blend = 1;
    const q = new THREE.Quaternion(),
      q2 = new THREE.Quaternion(),
      e = new THREE.Euler();
    const pose = (name: string, x = 0, y = 0, z = 0) => {
      const b = bones[name];
      if (!b) return;
      q.setFromEuler(e.set(x, y, z));
      q2.copy(parentRest[name])
        .invert()
        .multiply(q)
        .multiply(parentRest[name])
        .multiply(rest[name]);
      b.quaternion.slerp(q2, blend);
    };
    const animate = (
      t: number,
      action: AvatarMotion["action"],
      speed: number,
      delta = 1,
    ) => {
      blend = delta === 1 ? 1 : 1 - Math.exp(-delta * 14);
      const walk = action === "walk",
        stride = walk ? Math.sin(t * 7) * Math.min(0.48, speed * 0.13) : 0,
        water = action === "water",
        work = action === "feed" || action === "work",
        bond = action === "bond";
      pose("spine_01", bond ? 0.14 : work ? 0.1 : 0);
      pose("spine_03", Math.sin(t * 1.8) * 0.008);
      pose(
        "Head",
        bond ? 0.24 : water ? 0.08 : Math.sin(t * 0.65) * 0.012,
        Math.sin(t * 0.4) * 0.025,
      );
      pose(
        "upperarm_l",
        water ? -0.32 : work ? -0.48 : bond ? -0.22 : -stride * 0.65,
        0,
        -1.4,
      );
      pose(
        "upperarm_r",
        water ? -0.68 : work ? -0.48 : bond ? -0.22 : stride * 0.65,
        0,
        1.4,
      );
      pose("lowerarm_l", 0, water ? -0.65 : work ? -0.7 : -0.12);
      pose("lowerarm_r", 0, water ? 0.72 : work ? 0.7 : 0.12);
      pose("thigh_l", stride);
      pose("thigh_r", -stride);
      pose("calf_l", walk ? Math.max(0, -Math.sin(t * 7)) * 0.55 : 0);
      pose("calf_r", walk ? Math.max(0, Math.sin(t * 7)) * 0.55 : 0);
      for (const side of ["l", "r"])
        for (const finger of ["index", "middle", "ring", "pinky"])
          for (const joint of ["01", "02", "03"])
            pose(
              `${finger}_${joint}_${side}`,
              0,
              0,
              (side === "l" ? 1 : -1) * (water ? 0.45 : 0.16),
            );
      scene.updateMatrixWorld(true);
    };
    bones.Head.scale.setScalar(1.14);
    animate(0, "idle", 0);
    const bounds = new THREE.Box3().setFromObject(scene, true);
    return {
      scene,
      bones,
      animate,
      ownedMaterials,
      ownedGeometry,
      height: bounds.max.y - bounds.min.y,
      ground: bounds.min.y,
    };
  }, [base.scene, hair.scene, style, masculine, floralShorts]);
  useEffect(
    () => () => {
      rig.ownedMaterials.forEach((m) => m.dispose());
      rig.ownedGeometry.forEach((g) => g.dispose());
    },
    [rig],
  );
  const can = useRef<THREE.Group>(null),
    spout = useRef<THREE.Group>(null),
    drops = useRef<THREE.InstancedMesh>(null),
    root = useRef<THREE.Group>(null);
  const scratch = useMemo(
    () => ({
      start: new THREE.Vector3(),
      end: new THREE.Vector3(),
      point: new THREE.Vector3(),
      dummy: new THREE.Object3D(),
      q: new THREE.Quaternion(),
    }),
    [],
  );
  useFrame((_, d) => {
    phase.current += Math.min(d, 0.05);
    const activity = motion?.current,
      action = activity?.action || "idle",
      water = action === "water";
    rig.animate(phase.current, action, activity?.speed || 0, Math.min(d, 0.05));
    if (can.current && root.current) {
      can.current.visible = water;
      if (water) {
        rig.bones.hand_r.getWorldPosition(scratch.point);
        root.current.worldToLocal(scratch.point);
        can.current.position
          .copy(scratch.point)
          .add(new THREE.Vector3(0, -0.12, 0.035));
        can.current.rotation.set(0.55, 0, 0);
      }
    }
    if (drops.current) {
      drops.current.visible = water && !!activity?.waterTarget;
      if (water && spout.current && activity?.waterTarget) {
        spout.current.getWorldPosition(scratch.start);
        drops.current.worldToLocal(scratch.start);
        scratch.end.set(...activity.waterTarget);
        drops.current.worldToLocal(scratch.end);
        for (let i = 0; i < 28; i++) {
          const t = (phase.current * 1.9 + i / 28) % 1;
          scratch.point.lerpVectors(scratch.start, scratch.end, t);
          scratch.point.y += Math.sin(t * Math.PI) * 0.08;
          scratch.point.x += Math.sin(i * 2.4) * t * 0.08;
          scratch.dummy.position.copy(scratch.point);
          scratch.dummy.scale.set(0.012, 0.026, 0.012);
          scratch.dummy.updateMatrix();
          drops.current.setMatrixAt(i, scratch.dummy.matrix);
        }
        drops.current.instanceMatrix.needsUpdate = true;
      }
    }
  });
  return (
    <group
      ref={root}
      name={`avatar-${style.displayName}`}
      position={[0, (-rig.ground * style.height) / rig.height, 0]}
      scale={[
        (style.height / rig.height) *
          style.build *
          (style.bodyFrame === "androgynous" ? 0.82 : masculine ? 0.9 : 1),
        style.height / rig.height,
        (style.height / rig.height) * style.build,
      ]}
    >
      <primitive object={rig.scene} />
      <group name="held-watering-can" ref={can} visible={false}>
        <mesh castShadow>
          <cylinderGeometry args={[0.105, 0.12, 0.2, 24]} />
          <meshStandardMaterial
            color="#719e97"
            metalness={0.15}
            roughness={0.5}
          />
        </mesh>
        <mesh position={[0, 0.15, 0]}>
          <torusGeometry args={[0.07, 0.012, 8, 24, Math.PI]} />
          <meshStandardMaterial color="#365f59" />
        </mesh>
        <mesh
          position={[0, 0.025, 0.18]}
          rotation={[Math.PI / 2 - 0.3, 0, 0]}
          castShadow
        >
          <cylinderGeometry args={[0.025, 0.04, 0.27, 16]} />
          <meshStandardMaterial color="#719e97" />
        </mesh>
        <group ref={spout} position={[0, 0.06, 0.31]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.055, 0.03, 0.028, 16]} />
            <meshStandardMaterial
              color="#d2ddd1"
              metalness={0.4}
              roughness={0.4}
            />
          </mesh>
        </group>
      </group>
      <instancedMesh
        name="watering-stream"
        ref={drops}
        args={[undefined, undefined, 28]}
        visible={false}
        frustumCulled={false}
      >
        <sphereGeometry args={[1, 6, 4]} />
        <meshStandardMaterial
          color="#bcecff"
          emissive="#4b97ae"
          emissiveIntensity={0.3}
          transparent
          opacity={0.85}
        />
      </instancedMesh>
    </group>
  );
}
