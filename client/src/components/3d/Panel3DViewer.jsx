import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import MiningScene from "./MiningScene";

export default function Panel3DViewer({
  snapshot,
  instrunmentsData,
  instrumentValues,
}) {
  return (
    <Canvas
      shadows
      camera={{
        position: [0, 55, 70],
        fov: 55,
      }}
    >
      <color
        attach="background"
        args={["#f0f4fa"]}
      />

      <ambientLight intensity={1.2} />

      <directionalLight
        castShadow
        intensity={2}
        position={[100, 150, 100]}
      />

      <MiningScene
        snapshot={snapshot}
        instrunmentsData={
          instrunmentsData
        }
        instrumentValues={
          instrumentValues
        }
      />

      <OrbitControls
        target={[0, 0, 0]}
        minDistance={20}
        maxDistance={120}
      />
    </Canvas>
  );
}