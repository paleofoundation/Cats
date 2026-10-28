import { Suspense, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { ContactShadows, OrbitControls } from "@react-three/drei";
import { GardenAvatar, type AvatarMotion } from "./GardenAvatar";
import { GardenCat, type CatMotion } from "./GardenCat";
import { karenAvatar, chandaAvatar, avatarPresets } from "./game/avatars";
import { CatFoodDish } from "./CareProps";
import { companionProfiles } from "./game/companions";

export default function CharacterStudio() {
  const [action, setAction] = useState<AvatarMotion["action"]>("idle");
  const [person, setPerson] = useState(0),
    [cat, setCat] = useState(1);
  const avatarMotion = useRef<AvatarMotion>({ speed: 0, action: "idle" }),
    catMotion = useRef<CatMotion>({ action: "idle" });
  avatarMotion.current = {
    speed: action === "walk" ? 2 : 0,
    action,
    waterTarget: [-0.85, 0.25, 0.65],
  };
  catMotion.current.action =
    action === "feed" ? "eat" : action === "walk" ? "walk" : "idle";
  const people = [
    karenAvatar,
    chandaAvatar,
    avatarPresets[1].style,
    avatarPresets[2].style,
  ];
  return (
    <main
      style={{
        height: "100dvh",
        background: "#e5e5d4",
        color: "#263c33",
        fontFamily: "Manrope,sans-serif",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 28,
          left: 32,
          zIndex: 2,
          maxWidth: 340,
        }}
      >
        <p style={{ fontSize: 11, letterSpacing: 3 }}>
          CAT GARDENS · CHARACTER PREVIEW
        </p>
        <h1
          style={{
            fontFamily: "Georgia,serif",
            fontSize: 38,
            fontWeight: 400,
            lineHeight: 1.1,
            margin: "8px 0",
          }}
        >
          A gentler garden.
        </h1>
        <p style={{ fontSize: 13, lineHeight: 1.6 }}>
          New people. Rounded cats. One shared world.
          <br />
          Drag to turn the camera. Scroll to look closer.
        </p>
      </div>
      <Canvas
        shadows="percentage"
        dpr={[1, 1.5]}
        camera={{ position: [2.3, 1.75, 4.8], fov: 34 }}
        gl={{ antialias: true }}
      >
        <color attach="background" args={["#e5e5d4"]} />
        <fog attach="fog" args={["#e5e5d4", 8, 18]} />
        <ambientLight intensity={0.8} />
        <hemisphereLight args={["#fff2dd", "#95a190", 1.6]} />
        <directionalLight
          position={[-3, 6, 4]}
          intensity={2.8}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-normalBias={0.02}
        />
        <directionalLight
          position={[3, 3, -4]}
          intensity={1.6}
          color="#fff0ce"
        />
        <Suspense fallback={null}>
          <group position={[-0.42, 0, 0]}>
            <GardenAvatar
              appearance={people[person]}
              motion={avatarMotion}
              floralShorts={person === 1}
            />
          </group>
          <group position={[0.62, 0, 0.2]} rotation={[0, -0.2, 0]}>
            <GardenCat
              phenotype={companionProfiles[cat].phenotype}
              motion={catMotion}
            />
          </group>
          {action === "feed" && (
            <CatFoodDish
              position={[0.62, 0, 0.62]}
              size={0.55}
              name={companionProfiles[cat].name}
              eating
            />
          )}
          {action === "water" && (
            <group position={[-0.85, 0, 0.65]}>
              <mesh position={[0, 0.1, 0]}>
                <cylinderGeometry args={[0.18, 0.13, 0.2, 24]} />
                <meshStandardMaterial color="#b98464" />
              </mesh>
              <mesh position={[0, 0.3, 0]} scale={[0.15, 0.22, 0.15]}>
                <sphereGeometry args={[1, 24, 16]} />
                <meshStandardMaterial color="#739570" />
              </mesh>
            </group>
          )}
        </Suspense>
        <mesh
          receiveShadow
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, -0.015, 0]}
        >
          <planeGeometry args={[200, 200]} />
          <meshStandardMaterial color="#e5e5d4" roughness={1} />
        </mesh>
        <ContactShadows
          position={[0, -0.01, 0]}
          opacity={0.3}
          scale={12}
          blur={2.5}
          far={3}
          resolution={512}
        />
        <OrbitControls
          target={[0.1, 0.67, 0]}
          minDistance={1.6}
          maxDistance={7}
          maxPolarAngle={Math.PI * 0.49}
        />
      </Canvas>
      <div
        style={{
          position: "absolute",
          bottom: 24,
          left: "50%",
          transform: "translateX(-50%)",
          width: "min(870px,94vw)",
          padding: 16,
          background: "#fffcf0e8",
          borderRadius: 22,
          boxShadow: "0 10px 50px #304b3420",
          zIndex: 3,
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        <select
          aria-label="Preview person"
          value={person}
          onChange={(e) => setPerson(Number(e.target.value))}
        >
          {people.map((p, i) => (
            <option key={i} value={i}>
              {p.displayName}
            </option>
          ))}
        </select>
        <select
          aria-label="Preview cat"
          value={cat}
          onChange={(e) => setCat(Number(e.target.value))}
        >
          {companionProfiles.slice(0, 3).map((p, i) => (
            <option key={i} value={i}>
              {p.name}
            </option>
          ))}
        </select>
        {(["idle", "walk", "bond", "water", "feed"] as const).map((a) => (
          <button
            key={a}
            onClick={() => setAction(a)}
            style={{
              border: 0,
              borderRadius: 12,
              padding: "10px 14px",
              background: action === a ? "#304f43" : "#e9eadf",
              color: action === a ? "#fff" : "#304f43",
            }}
          >
            {a === "idle"
              ? "Stand"
              : a === "bond"
                ? "Befriend"
                : a[0].toUpperCase() + a.slice(1)}
          </button>
        ))}
        <a
          href="/"
          style={{
            width: "100%",
            textAlign: "center",
            fontSize: 12,
            color: "#466251",
          }}
        >
          Play the garden with these characters →
        </a>
      </div>
    </main>
  );
}
