import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { localDay, useGame } from "./game/store";
import { getCompanionProfile } from "./game/companions";

export function FoodBowl() {
  const lastFedDate = useGame((state) => state.lastFedDate);
  const mealPosition = useGame((state) => state.mealPosition);
  const catId = useGame((state) => state.selectedCompanionId);
  const cat = getCompanionProfile(catId);
  const eating = useGame((state) => state.catAnimation === "eat");
  if (lastFedDate !== localDay()) return null;
  return (
    <CatFoodDish
      position={mealPosition || [2.65, 0, 4.1]}
      size={Math.max(0.35, cat.phenotype.scale * 0.56)}
      name={cat.name}
      eating={eating}
    />
  );
}

export function CatFoodDish({
  position,
  size,
  name,
  eating = false,
}: {
  position: [number, number, number];
  size: number;
  name: string;
  eating?: boolean;
}) {
  const kibble = useRef<THREE.Group>(null);
  const outline = useMemo(
    () =>
      [
        [0.23, 0.03],
        [0.3, 0.045],
        [0.36, 0.19],
        [0.34, 0.23],
        [0.3, 0.21],
        [0.255, 0.075],
        [0, 0.075],
      ].map(([x, y]) => new THREE.Vector2(x, y)),
    [],
  );
  useFrame((_, delta) => {
    if (!kibble.current) return;
    const target = eating ? 0.45 : kibble.current.scale.y;
    kibble.current.scale.y = THREE.MathUtils.damp(
      kibble.current.scale.y,
      target,
      0.15,
      Math.min(delta, 0.05),
    );
  });
  return (
    <group name="served-food-bowl" position={position} scale={size}>
      <mesh castShadow receiveShadow>
        <latheGeometry args={[outline, 32]} />
        <meshStandardMaterial
          color="#c48759"
          metalness={0.12}
          roughness={0.4}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh position={[0, 0.22, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.333, 0.017, 8, 32]} />
        <meshStandardMaterial
          color="#efd9ae"
          metalness={0.15}
          roughness={0.35}
        />
      </mesh>
      <group ref={kibble} position={[0, 0.08, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.26, 24]} />
          <meshStandardMaterial color="#795138" roughness={1} />
        </mesh>
        {Array.from({ length: 32 }, (_, i) => {
          const angle = i * 2.4,
            radius = Math.sqrt((i + 0.5) / 32) * 0.245;
          return (
            <mesh
              key={i}
              position={[
                Math.cos(angle) * radius,
                0.025 + (i % 3) * 0.01,
                Math.sin(angle) * radius,
              ]}
              rotation={[0, i, 0]}
              castShadow
            >
              <dodecahedronGeometry args={[0.035, 0]} />
              <meshStandardMaterial
                color={
                  i % 3 === 0 ? "#b9874c" : i % 3 === 1 ? "#805332" : "#a06b3e"
                }
                roughness={1}
              />
            </mesh>
          );
        })}
      </group>
      <Html
        center
        position={[0, 0.55, 0]}
        zIndexRange={[3, 0]}
        style={{ pointerEvents: "none" }}
      >
        <div className="meal-label">{name}’s food</div>
      </Html>
    </group>
  );
}
