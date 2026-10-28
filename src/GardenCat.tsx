import { useEffect, useMemo, useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { CompanionPhenotype } from "./game/companions";

type Point = [number, number, number];
export type CatMotion = {
  action: "idle" | "walk" | "eat" | "dance";
  bond?: number;
};
function Form({
  position,
  scale,
  color,
  roughness = 0.85,
  tabby,
  part = "body",
}: {
  position: Point;
  scale: Point;
  color: string;
  roughness?: number;
  tabby?: string;
  part?: "body" | "head";
}) {
  const material = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({ color, roughness });
    if (tabby) {
      m.onBeforeCompile = (shader) => {
        shader.uniforms.tabbyColor = { value: new THREE.Color(tabby) };
        shader.vertexShader =
          "varying vec3 furPosition;\n" + shader.vertexShader;
        shader.vertexShader = shader.vertexShader.replace(
          "#include <begin_vertex>",
          "#include <begin_vertex>\nfurPosition=position;",
        );
        shader.fragmentShader =
          "varying vec3 furPosition; uniform vec3 tabbyColor;\n" +
          shader.fragmentShader;
        shader.fragmentShader = shader.fragmentShader.replace(
          "#include <color_fragment>",
          `#include <color_fragment>
          float stripe=${part === "body" ? "smoothstep(.64,.84,sin(furPosition.z*16.0+abs(furPosition.x)*2.5))*smoothstep(-.25,.25,furPosition.y)" : "smoothstep(.66,.86,cos(furPosition.x*23.0+furPosition.y*5.0))*smoothstep(.42,.65,furPosition.y)*smoothstep(.2,.4,furPosition.z)"};
          diffuseColor.rgb=mix(diffuseColor.rgb,tabbyColor,stripe*.85);
        `,
        );
      };
      m.customProgramCacheKey = () => `fur-${part}-${tabby}`;
    }
    return m;
  }, [color, roughness, tabby, part]);
  useEffect(() => () => material.dispose(), [material]);
  return (
    <mesh
      position={position}
      scale={scale}
      material={material}
      castShadow
      receiveShadow
    >
      <sphereGeometry args={[1, 32, 24]} />
    </mesh>
  );
}
function Curve({
  points,
  radius,
  color,
}: {
  points: Point[];
  radius: number;
  color: string;
}) {
  const curve = useMemo(
    () =>
      new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p))),
    [points],
  );
  return (
    <mesh castShadow>
      <tubeGeometry args={[curve, 24, radius, 8, false]} />
      <meshStandardMaterial color={color} roughness={0.8} />
    </mesh>
  );
}
function Ear({ side, color }: { side: number; color: string }) {
  const shape = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-0.075, 0);
    s.quadraticCurveTo(-0.065, 0.1, -0.04, 0.19);
    s.quadraticCurveTo(-0.03, 0.21, -0.012, 0.19);
    s.quadraticCurveTo(0.08, 0.065, 0.08, 0);
    s.closePath();
    return s;
  }, []);
  return (
    <group
      scale={[0.9, 0.8, 1]}
      position={[side * 0.135, 0.1, 0]}
      rotation={[0, 0, -side * 0.24]}
    >
      <mesh castShadow>
        <extrudeGeometry
          args={[
            shape,
            {
              depth: 0.045,
              bevelEnabled: true,
              bevelSize: 0.015,
              bevelThickness: 0.018,
              bevelSegments: 3,
              steps: 1,
              curveSegments: 12,
            },
          ]}
        />
        <meshStandardMaterial color={color} roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.028, 0.068]} scale={[0.61, 0.68, 1]}>
        <shapeGeometry args={[shape, 20]} />
        <meshStandardMaterial
          color="#d9a59e"
          roughness={1}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}
/** Original rounded cat model, built in metres; the head and all face details share a pivot. */
export function GardenCat({
  phenotype: p,
  motion,
}: {
  phenotype: CompanionPhenotype;
  motion?: RefObject<CatMotion>;
}) {
  const head = useRef<THREE.Group>(null),
    tail = useRef<THREE.Group>(null),
    body = useRef<THREE.Group>(null);
  const eyes = useRef<Array<THREE.Group | null>>([]),
    legs = useRef<Array<THREE.Group | null>>([]),
    time = useRef(0);
  const cream = p.pattern === "tabby" ? "#f1d5af" : p.baseColor;
  useFrame((_, delta) => {
    time.current += Math.min(delta, 0.05);
    const t = time.current,
      a = motion?.current?.action || "idle",
      walking = a === "walk",
      eat = a === "eat";
    if (head.current) {
      head.current.rotation.x = THREE.MathUtils.damp(
        head.current.rotation.x,
        eat ? 0.73 : Math.sin(t * 0.7) * 0.035,
        8,
        Math.min(delta, 0.05),
      );
      head.current.position.y = THREE.MathUtils.damp(
        head.current.position.y,
        eat ? 0.31 + Math.sin(t * 8) * 0.007 : 0.48,
        8,
        Math.min(delta, 0.05),
      );
      head.current.rotation.z =
        a === "dance" ? Math.sin(t * 4) * 0.14 : Math.sin(t * 0.6) * 0.025;
    }
    if (tail.current) {
      tail.current.rotation.z = Math.sin(t * 1.25) * 0.1;
      tail.current.rotation.y = Math.sin(t * 0.9) * 0.2;
    }
    const blink = t % 5.3;
    eyes.current.forEach((eye) => {
      if (eye)
        eye.scale.y = blink < 0.18 ? 0.1 + Math.abs(blink - 0.09) * 10 : 1;
    });
    if (body.current)
      body.current.position.y =
        a === "dance"
          ? Math.abs(Math.sin(t * 4)) * 0.035
          : walking
            ? Math.abs(Math.sin(t * 9)) * 0.008
            : Math.sin(t * 1.8) * 0.003;
    legs.current.forEach((leg, i) => {
      if (leg)
        leg.rotation.x = walking
          ? Math.sin(t * 9 + (i === 0 || i === 3 ? 0 : Math.PI)) * 0.38
          : 0;
    });
  });
  return (
    <group
      name="rounded-garden-cat"
      scale={[p.scale * p.width, p.scale, p.scale * p.length]}
    >
      <group ref={body}>
        <Form
          position={[0, 0.285, -0.065]}
          scale={[0.16, 0.19, 0.295]}
          color={p.baseColor}
          tabby={p.pattern === "tabby" ? p.secondaryColor : undefined}
        />
        <Form
          position={[0, 0.31, 0.12]}
          scale={[0.15, 0.18, 0.145]}
          color={cream}
        />
        {[-1, 1].flatMap((s, si) =>
          [-0.23, 0.16].map((z, zi) => (
            <group
              key={`${s}-${z}`}
              ref={(el) => {
                legs.current[si * 2 + zi] = el;
              }}
              position={[s * 0.105, 0.255, z]}
            >
              <Form
                position={[0, -0.08, 0]}
                scale={[0.061, 0.145, 0.068]}
                color={p.baseColor}
              />
              <Form
                position={[0, -0.214, 0.033]}
                scale={[0.073, 0.041, 0.091]}
                color={cream}
              />
              {[-1, 1].map((n) => (
                <Curve
                  key={n}
                  points={[
                    [n * 0.022, -0.23, 0.102],
                    [n * 0.022, -0.211, 0.112],
                    [n * 0.022, -0.201, 0.11],
                  ]}
                  radius={0.0018}
                  color={p.secondaryColor}
                />
              ))}
            </group>
          )),
        )}
        <group ref={tail} position={[0, 0.34, -0.3]}>
          <Curve
            points={[
              [0, 0, 0],
              [0.035, 0.12, -0.11],
              [0.065, 0.3, -0.13],
              [0.04, 0.41, -0.07],
              [-0.025, 0.42, -0.045],
            ]}
            radius={0.037}
            color={p.baseColor}
          />
          {p.pattern === "tabby" && (
            <Form
              position={[-0.025, 0.42, -0.045]}
              scale={[0.037, 0.039, 0.037]}
              color={p.secondaryColor}
            />
          )}
        </group>
        <group ref={head} position={[0, 0.48, 0.22]}>
          <Form
            position={[0, 0, 0]}
            scale={[0.205, 0.175, 0.171]}
            color={p.baseColor}
            part="head"
            tabby={p.pattern === "tabby" ? p.secondaryColor : undefined}
          />
          <Ear side={-1} color={p.baseColor} />
          <Ear side={1} color={p.baseColor} />
          {[-1, 1].map((side, i) => (
            <group key={side}>
              <Form
                position={[side * 0.125, -0.065, 0.06]}
                scale={[0.097, 0.085, 0.105]}
                color={p.baseColor}
              />
              {i < p.eyeCount ? (
                <group
                  ref={(el) => {
                    eyes.current[i] = el;
                  }}
                >
                  <Form
                    position={[side * 0.083, 0.017, 0.142]}
                    scale={[0.053, 0.061, 0.025]}
                    color="#f0e9da"
                  />
                  <Form
                    position={[side * 0.083, 0.02, 0.16]}
                    scale={[0.039, 0.052, 0.018]}
                    color={p.blind ? "#d8dedb" : p.eyeColor}
                    roughness={0.26}
                  />
                  {!p.blind && (
                    <>
                      <Form
                        position={[side * 0.082, 0.021, 0.182]}
                        scale={[0.013, 0.038, 0.006]}
                        color="#17251d"
                        roughness={0.23}
                      />
                      <Form
                        position={[side * 0.083 - 0.016, 0.048, 0.189]}
                        scale={[0.009, 0.011, 0.004]}
                        color="#ffffff"
                        roughness={0.15}
                      />
                      <Form
                        position={[side * 0.083 + 0.015, 0.003, 0.185]}
                        scale={[0.005, 0.006, 0.004]}
                        color="#e5f4d5"
                      />
                    </>
                  )}
                </group>
              ) : (
                <Curve
                  points={[
                    [side * 0.045, 0.014, 0.16],
                    [side * 0.08, -0.001, 0.18],
                    [side * 0.118, 0.014, 0.153],
                  ]}
                  radius={0.005}
                  color={p.secondaryColor}
                />
              )}
              <Form
                position={[side * 0.041, -0.07, 0.158]}
                scale={[0.059, 0.042, 0.039]}
                color={cream}
              />
              <Curve
                points={[
                  [0, -0.073, 0.199],
                  [side * 0.018, -0.094, 0.196],
                  [side * 0.043, -0.09, 0.187],
                ]}
                radius={0.0027}
                color="#9a7770"
              />
              {[0, 1, 2].map((j) => (
                <Curve
                  key={j}
                  points={[
                    [side * 0.073, -0.068 - j * 0.012, 0.175],
                    [side * 0.155, -0.05 - j * 0.025, 0.16],
                    [side * 0.26, -0.04 - j * 0.035, 0.115],
                  ]}
                  radius={0.0014}
                  color="#c3baac"
                />
              ))}
              {p.pattern === "tabby" &&
                [0, 1].map((j) => (
                  <Curve
                    key={j}
                    points={[
                      [side * 0.15, -0.01 - j * 0.03, 0.12],
                      [side * 0.19, -0.015 - j * 0.03, 0.077],
                      [side * 0.197, -0.025 - j * 0.03, 0.03],
                    ]}
                    radius={0.01}
                    color={p.secondaryColor}
                  />
                ))}
            </group>
          ))}
          <Form
            position={[0, -0.055, 0.193]}
            scale={[0.026, 0.017, 0.012]}
            color="#cc8e87"
            roughness={0.6}
          />
        </group>
      </group>
    </group>
  );
}
