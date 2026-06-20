import { Text } from "@react-three/drei";
import * as THREE from "three";
import { useMemo } from "react";

function createShape(coords) {
  const shape = new THREE.Shape();

  shape.moveTo(coords[0].x, coords[0].y);

  for (let i = 1; i < coords.length; i++) {
    shape.lineTo(coords[i].x, coords[i].y);
  }

  shape.lineTo(coords[0].x, coords[0].y);

  return shape;
}

export default function PillarMesh({
  pillar,
  color,
}) {
  const pillarHeight = 5;

  const geometry = useMemo(() => {
    const shape = createShape(
      pillar.coordinates
    );

    return new THREE.ExtrudeGeometry(
      shape,
      {
        depth: pillarHeight,
        bevelEnabled: false,
      }
    );
  }, [pillar]);

  const centerX =
    pillar.coordinates.reduce(
      (s, p) => s + p.x,
      0
    ) / pillar.coordinates.length;

  const centerY =
    pillar.coordinates.reduce(
      (s, p) => s + p.y,
      0
    ) / pillar.coordinates.length;

  return (
    <group>

      {/* Base pillar */}
      <mesh
        geometry={geometry}
        rotation={[-Math.PI / 2, 0, 0]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial
          color={color}
        />
      </mesh>

      {/* SPLITS */}
      {pillar.splits?.map(
        (split, idx) => {
          const splitShape =
            createShape(
              split.coordinates
            );

          const splitGeo =
            new THREE.ExtrudeGeometry(
              splitShape,
              {
                depth:
                  pillarHeight + 0.2,
                bevelEnabled:
                  false,
              }
            );

          return (
            <mesh
              key={`split-${idx}`}
              geometry={splitGeo}
              rotation={[
                -Math.PI / 2,
                0,
                0,
              ]}
            >
              <meshStandardMaterial
                color={
                  split.status ===
                  "extracted"
                    ? "#666666"
                    : "#ffd700"
                }
              />
            </mesh>
          );
        }
      )}

      {/* SLICES */}
      {pillar.slices?.map(
        (slice, idx) => {
          const sliceShape =
            createShape(
              slice.coordinates
            );

          const sliceGeo =
            new THREE.ExtrudeGeometry(
              sliceShape,
              {
                depth:
                  pillarHeight + 0.4,
                bevelEnabled:
                  false,
              }
            );

          return (
            <mesh
              key={`slice-${idx}`}
              geometry={sliceGeo}
              rotation={[
                -Math.PI / 2,
                0,
                0,
              ]}
            >
              <meshStandardMaterial
                color={
                  slice.status ===
                  "extracted"
                    ? "#404040"
                    : "#ff8c00"
                }
              />
            </mesh>
          );
        }
      )}

      {/* Label */}
      <Text
        position={[
          centerX,
          pillarHeight + 2,
          centerY,
        ]}
        fontSize={2.5}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {pillar.pillarNumber}
      </Text>
    </group>
  );
}