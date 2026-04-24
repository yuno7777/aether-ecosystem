// @ts-nocheck
"use client";
import React, { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text, Float, Html } from '@react-three/drei';
import * as THREE from 'three';
import { Warehouse, ProductAnalytics } from '../types';

interface Warehouse3DProps {
  warehouses: Warehouse[];
  analytics: ProductAnalytics[];
}

// Individual zone block
function ZoneBlock({ position, size, utilization, label, productCount }: {
  position: [number, number, number];
  size: [number, number, number];
  utilization: number;
  label: string;
  productCount: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  const color = useMemo(() => {
    if (utilization > 0.85) return '#ef4444';
    if (utilization > 0.6) return '#f59e0b';
    return '#22c55e';
  }, [utilization]);

  const emissiveIntensity = hovered ? 0.4 : 0.15;

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.5 + position[0]) * 0.02;
    }
  });

  return (
    <group>
      <mesh
        ref={meshRef}
        position={position}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        castShadow
        receiveShadow
      >
        <boxGeometry args={size} />
        <meshStandardMaterial
          color={color}
          transparent
          opacity={hovered ? 0.9 : 0.65}
          emissive={color}
          emissiveIntensity={emissiveIntensity}
          roughness={0.3}
          metalness={0.6}
        />
      </mesh>

      {/* Wireframe overlay */}
      <mesh position={position}>
        <boxGeometry args={[size[0] + 0.02, size[1] + 0.02, size[2] + 0.02]} />
        <meshBasicMaterial color={color} wireframe transparent opacity={0.3} />
      </mesh>

      {/* Label */}
      <Text
        position={[position[0], position[1] + size[1] / 2 + 0.3, position[2]]}
        fontSize={0.18}
        color="white"
        anchorX="center"
        anchorY="bottom"
        font="https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuI6fAZ9hiJ-Ek-_EeA.woff2"
      >
        {label}
      </Text>

      {/* Utilization label */}
      <Text
        position={[position[0], position[1] + size[1] / 2 + 0.12, position[2]]}
        fontSize={0.13}
        color={color}
        anchorX="center"
        anchorY="bottom"
        font="https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuFuYAZ9hiJ-Ek-_EeA.woff2"
      >
        {`${Math.round(utilization * 100)}% · ${productCount} items`}
      </Text>

      {/* Hover tooltip */}
      {hovered && (
        <Html position={[position[0], position[1] + size[1] + 0.8, position[2]]}>
          <div style={{
            background: '#0c0c0e',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '10px',
            padding: '10px 14px',
            color: 'white',
            fontSize: '11px',
            minWidth: '120px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
            transform: 'translateX(-50%)',
            whiteSpace: 'nowrap',
          }}>
            <div style={{ fontWeight: 600, marginBottom: '4px', color: '#7663b0' }}>{label}</div>
            <div style={{ color: '#9ca3af' }}>Utilization: {Math.round(utilization * 100)}%</div>
            <div style={{ color: '#9ca3af' }}>Products: {productCount}</div>
          </div>
        </Html>
      )}
    </group>
  );
}

// Floor grid
function FloorGrid() {
  return (
    <group>
      <gridHelper args={[20, 40, '#1a1a2e', '#0f0f1a']} position={[0, -0.01, 0]} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#0a0a0c" roughness={0.9} />
      </mesh>
    </group>
  );
}

// Ambient particles
function Particles() {
  const count = 100;
  const particles = useMemo(() => {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 15;
      positions[i * 3 + 1] = Math.random() * 5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 15;
    }
    return positions;
  }, []);

  const ref = useRef<THREE.Points>(null);

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = state.clock.elapsedTime * 0.02;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={particles} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.03} color="#7663b0" transparent opacity={0.4} sizeAttenuation />
    </points>
  );
}


export const Warehouse3D: React.FC<Warehouse3DProps> = ({ warehouses, analytics }) => {
  // Build zone data from warehouses
  const zones = useMemo(() => {
    return warehouses.map((wh, i) => {
      // Products assigned to this warehouse
      const warehouseProducts = analytics.filter(a => a.product.warehouseId === wh.id);
      const totalStock = warehouseProducts.reduce((sum, a) => sum + a.product.stock, 0);
      const utilization = Math.min(1, totalStock / Math.max(1, wh.capacity));

      // Position zones in a grid
      const col = i % 3;
      const row = Math.floor(i / 3);
      const x = (col - 1) * 4;
      const z = (row - 0.5) * 4;
      const height = 0.5 + utilization * 2;

      return {
        id: wh.id,
        label: wh.name.length > 20 ? wh.name.slice(0, 20) + '...' : wh.name,
        position: [x, height / 2, z] as [number, number, number],
        size: [2.5, height, 2.5] as [number, number, number],
        utilization,
        productCount: warehouseProducts.length,
      };
    });
  }, [warehouses, analytics]);

  return (
    <div className="w-full h-[500px] rounded-2xl overflow-hidden border border-white/10 bg-[#0a0a0c]">
      <Canvas
        camera={{ position: [8, 6, 8], fov: 45 }}
        shadows
        dpr={[1, 2]}
        gl={{ antialias: true }}
      >
        <color attach="background" args={['#0a0a0c']} />
        <fog attach="fog" args={['#0a0a0c', 12, 25]} />

        {/* Lighting */}
        <ambientLight intensity={0.3} />
        <directionalLight
          position={[5, 8, 5]}
          intensity={0.6}
          castShadow
          shadow-mapSize={[1024, 1024]}
        />
        <pointLight position={[0, 4, 0]} intensity={0.5} color="#7663b0" />
        <pointLight position={[-5, 3, -3]} intensity={0.3} color="#7c3aed" />

        <FloorGrid />
        <Particles />

        {zones.map(zone => (
          <ZoneBlock
            key={zone.id}
            position={zone.position}
            size={zone.size}
            utilization={zone.utilization}
            label={zone.label}
            productCount={zone.productCount}
          />
        ))}

        <OrbitControls
          enableDamping
          dampingFactor={0.05}
          minDistance={5}
          maxDistance={20}
          maxPolarAngle={Math.PI / 2.2}
          enablePan={false}
        />
      </Canvas>
    </div>
  );
};
