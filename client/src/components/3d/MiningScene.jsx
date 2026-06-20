import { Grid } from "@react-three/drei";
import PillarMesh from "./PillarMesh";

const PILLAR_COLORS = {
  active: "#14285a",
  intact: "#14285a",
  splitting: "#14285a",
  slicing: "#14285a",
  extracted: "#a0a0a0",
  failed: "#8b0000",
};

export default function MiningScene({
  snapshot,
}) {
  const pillars = snapshot?.pillars || [];

  const allPoints = pillars.flatMap(
    (p) => p.coordinates || []
  );

  if (!allPoints.length) return null;

  const minX = Math.min(...allPoints.map(p => p.x));
  const maxX = Math.max(...allPoints.map(p => p.x));

  const minY = Math.min(...allPoints.map(p => p.y));
  const maxY = Math.max(...allPoints.map(p => p.y));

  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;

  return (
    <>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[180, 180]} />
        <meshStandardMaterial color="#dce3ef" />
      </mesh>

      <Grid
        args={[180, 180]}
        cellSize={5}
        cellThickness={0.5}
        sectionSize={25}
        sectionThickness={1}
        fadeDistance={500}
      />

      <group
  position={[

    -centerX,

    0,

    -centerY + 20,

  ]}
      >
        {pillars.map((pillar, idx) => (
          <PillarMesh
            key={idx}
            pillar={pillar}
            color={
              PILLAR_COLORS[
                pillar.status
              ] ||
              PILLAR_COLORS.intact
            }
          />
        ))}
      </group>
    </>
  );
}