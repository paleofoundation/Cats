import { RoundedBox, Text } from "@react-three/drei";
import { useGame } from "./game/store";
import { itemById } from "./game/adventures";

/** Furnishings use the same catalogue colors as the collection cards. */
export function CollectionObjects() {
  const equipped = useGame((s) => s.adventure.equipped);
  const gardenName = useGame((s) => s.gardenName);
  const litter = itemById(equipped.litter),
    sign = itemById(equipped.sign),
    bowl = itemById(equipped.bowl);
  return (
    <group name="player-collection">
      {litter && (
        <group
          name={`collection-${litter.id}`}
          position={[5.55, 0, 4.9]}
          rotation={[0, -0.25, 0]}
        >
          <RoundedBox
            args={[0.85, 0.12, 1.05]}
            radius={0.08}
            position={[0, 0.07, 0]}
            castShadow
            receiveShadow
          >
            <meshStandardMaterial color={litter.color} />
          </RoundedBox>
          <RoundedBox
            args={[0.68, 0.06, 0.86]}
            radius={0.035}
            position={[0, 0.145, 0]}
            receiveShadow
          >
            <meshStandardMaterial color="#d8c7a9" roughness={1} />
          </RoundedBox>
          {[-1, 1].map((side) => (
            <RoundedBox
              key={side}
              args={[0.07, 0.17, 0.98]}
              radius={0.025}
              position={[side * 0.39, 0.18, 0]}
              castShadow
            >
              <meshStandardMaterial color={litter.color} />
            </RoundedBox>
          ))}
          <RoundedBox
            args={[0.8, 0.17, 0.07]}
            radius={0.025}
            position={[0, 0.18, 0.48]}
            castShadow
          >
            <meshStandardMaterial color={litter.color} />
          </RoundedBox>
          <RoundedBox
            args={[0.8, 0.08, 0.07]}
            radius={0.025}
            position={[0, 0.14, -0.48]}
            castShadow
          >
            <meshStandardMaterial color={litter.accent} />
          </RoundedBox>
        </group>
      )}
      {sign && (
        <group
          name={`collection-${sign.id}`}
          position={[4.55, 0, 3.75]}
          rotation={[0, Math.PI - 0.2, 0]}
        >
          <RoundedBox
            args={[0.075, 0.9, 0.075]}
            radius={0.02}
            position={[0, 0.45, -0.06]}
            castShadow
          >
            <meshStandardMaterial color="#aa815b" />
          </RoundedBox>
          <RoundedBox
            args={[0.85, 0.45, 0.065]}
            radius={0.07}
            position={[0, 0.79, 0]}
            castShadow
          >
            <meshStandardMaterial color={sign.color} />
          </RoundedBox>
          <Text
            font="/fonts/garden-labels.woff"
            position={[0, 0.84, 0.04]}
            fontSize={0.062}
            maxWidth={0.72}
            textAlign="center"
            color={sign.accent}
          >
            {gardenName}
          </Text>
          <Text
            font="/fonts/garden-labels.woff"
            position={[0, 0.66, 0.04]}
            fontSize={0.035}
            color={sign.accent}
          >
            CATS WELCOME
          </Text>
        </group>
      )}
      {bowl && (
        <group name={`collection-${bowl.id}`} position={[1.25, 0, 5.6]}>
          <mesh position={[0, 0.08, 0]} castShadow>
            <cylinderGeometry args={[0.26, 0.21, 0.14, 32]} />
            <meshStandardMaterial color={bowl.color} roughness={0.28} />
          </mesh>
          <mesh position={[0, 0.15, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.235, 0.024, 8, 32]} />
            <meshStandardMaterial color={bowl.accent} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0.145, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.214, 32]} />
            <meshStandardMaterial
              color="#89bfc6"
              roughness={0.18}
              metalness={0.2}
            />
          </mesh>
        </group>
      )}
    </group>
  );
}
