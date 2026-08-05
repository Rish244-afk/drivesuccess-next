'use client';

import React, { useState, useEffect, Suspense, memo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

interface FloatingShapeProps {
  position: [number, number, number];
  color: string;
  speed: number;
  geometryType: 'torus' | 'icosahedron' | 'octahedron';
  scale?: number;
}

function FloatingShape({ position, color, speed, geometryType, scale = 1 }: FloatingShapeProps) {
  const meshRef = React.useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.getElapsedTime() * speed * 0.5;
      meshRef.current.rotation.y = state.clock.getElapsedTime() * speed * 0.3;
    }
  });

  const Geometry = () => {
    switch (geometryType) {
      case 'torus':
        return <torusGeometry args={[1, 0.4, 32, 100]} />;
      case 'icosahedron':
        return <icosahedronGeometry args={[1, 0]} />;
      case 'octahedron':
        return <octahedronGeometry args={[1, 0]} />;
      default:
        return <icosahedronGeometry args={[1, 0]} />;
    }
  };

  return (
    <Float speed={2} rotationIntensity={1} floatIntensity={2}>
      <mesh ref={meshRef} position={position} scale={scale}>
        <Geometry />
        <MeshDistortMaterial
          color={color}
          envMapIntensity={1}
          clearcoat={1}
          clearcoatRoughness={0.1}
          metalness={0.2}
          roughness={0.1}
          distort={0.3}
          speed={speed * 2}
          transparent={true}
          opacity={0.8}
        />
      </mesh>
    </Float>
  );
}

function Scene() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} color="#ffffff" />
      <directionalLight position={[-10, -10, -5]} intensity={0.5} color="#4F46E5" />
      
      <FloatingShape position={[-3, 1, -2]} color="#2563EB" speed={0.4} geometryType="icosahedron" scale={1.5} />
      <FloatingShape position={[4, -1, 0]} color="#7C3AED" speed={0.3} geometryType="torus" scale={1.2} />
      <FloatingShape position={[0, 3, -4]} color="#06B6D4" speed={0.5} geometryType="octahedron" scale={1} />
    </>
  );
}

interface Hero3DSceneProps {
  className?: string;
}

function Hero3DSceneInner({ className = '' }: Hero3DSceneProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const mediaQuery = window.matchMedia('(max-width: 768px)');
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    setIsMobile(mediaQuery.matches || motionQuery.matches);

    const handler = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches || window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    };

    mediaQuery.addEventListener('change', handler);
    motionQuery.addEventListener('change', handler);
    
    return () => {
      mediaQuery.removeEventListener('change', handler);
      motionQuery.removeEventListener('change', handler);
    };
  }, []);

  if (!isMounted) return null;

  if (isMobile) {
    return (
      <div className={`absolute inset-0 bg-gradient-to-br from-blue-50/30 via-white to-purple-50/20 -z-10 ${className}`}>
        {/* CSS Fallback for mobile */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-400/10 rounded-full blur-3xl" />
      </div>
    );
  }

  return (
    <div className={`absolute inset-0 -z-10 pointer-events-none ${className}`}>
      <Canvas
        camera={{ position: [0, 0, 10], fov: 45 }}
        dpr={[1, 2]}
        gl={{ alpha: true, antialias: true }}
      >
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>
    </div>
  );
}

export const Hero3DScene = memo(Hero3DSceneInner);
export default Hero3DScene;
