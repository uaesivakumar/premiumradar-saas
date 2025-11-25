/**
 * Neural Orb 3D Component - Sprint S22
 *
 * WebGL-based 3D AI Orb with neural mesh effects.
 * Uses Three.js + React Three Fiber for premium visuals.
 */

'use client';

import { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame, extend } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Sphere, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useReducedMotion } from '@/lib/motion/hooks';

// ============================================
// NEURAL MESH SHADER
// ============================================

const neuralMeshVertexShader = `
  varying vec2 vUv;
  varying vec3 vPosition;
  varying vec3 vNormal;

  uniform float uTime;
  uniform float uDistortion;

  // Simplex noise functions
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);

    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);

    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;

    i = mod289(i);
    vec4 p = permute(permute(permute(
              i.z + vec4(0.0, i1.z, i2.z, 1.0))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0))
            + i.x + vec4(0.0, i1.x, i2.x, 1.0));

    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;

    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);

    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);

    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);

    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));

    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;

    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);

    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;

    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }

  void main() {
    vUv = uv;
    vNormal = normal;

    vec3 pos = position;
    float noise = snoise(pos * 2.0 + uTime * 0.3) * uDistortion;
    pos += normal * noise;

    vPosition = pos;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const neuralMeshFragmentShader = `
  varying vec2 vUv;
  varying vec3 vPosition;
  varying vec3 vNormal;

  uniform float uTime;
  uniform vec3 uColor1;
  uniform vec3 uColor2;
  uniform float uFresnelPower;

  void main() {
    // Fresnel effect
    vec3 viewDirection = normalize(cameraPosition - vPosition);
    float fresnel = pow(1.0 - dot(viewDirection, vNormal), uFresnelPower);

    // Gradient based on position
    float gradient = smoothstep(-1.0, 1.0, vPosition.y);

    // Mix colors
    vec3 color = mix(uColor1, uColor2, gradient);

    // Add fresnel glow
    color += fresnel * 0.5;

    // Pulse effect
    float pulse = sin(uTime * 2.0) * 0.5 + 0.5;
    color += pulse * 0.1;

    gl_FragColor = vec4(color, 0.95);
  }
`;

// ============================================
// NEURAL ORB MESH COMPONENT
// ============================================

interface NeuralOrbMeshProps {
  color1: string;
  color2: string;
  isActive: boolean;
  distortion: number;
}

function NeuralOrbMesh({ color1, color2, isActive, distortion }: NeuralOrbMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uDistortion: { value: distortion },
      uColor1: { value: new THREE.Color(color1) },
      uColor2: { value: new THREE.Color(color2) },
      uFresnelPower: { value: 2.0 },
    }),
    [color1, color2, distortion]
  );

  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = clock.getElapsedTime();
      materialRef.current.uniforms.uDistortion.value = isActive ? distortion * 1.5 : distortion;
    }
    if (meshRef.current) {
      meshRef.current.rotation.y = clock.getElapsedTime() * 0.1;
    }
  });

  return (
    <mesh ref={meshRef}>
      <icosahedronGeometry args={[1.5, 64]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={neuralMeshVertexShader}
        fragmentShader={neuralMeshFragmentShader}
        uniforms={uniforms}
        transparent
      />
    </mesh>
  );
}

// ============================================
// NEURAL PARTICLES
// ============================================

interface NeuralParticlesProps {
  count: number;
  color: string;
}

function NeuralParticles({ count, color }: NeuralParticlesProps) {
  const particlesRef = useRef<THREE.Points>(null);

  const [positions, velocities] = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const radius = 2 + Math.random() * 0.5;

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);

      velocities[i * 3] = (Math.random() - 0.5) * 0.01;
      velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.01;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.01;
    }

    return [positions, velocities];
  }, [count]);

  useFrame(() => {
    if (particlesRef.current) {
      const positionsArray = particlesRef.current.geometry.attributes.position.array as Float32Array;

      for (let i = 0; i < count; i++) {
        positionsArray[i * 3] += velocities[i * 3];
        positionsArray[i * 3 + 1] += velocities[i * 3 + 1];
        positionsArray[i * 3 + 2] += velocities[i * 3 + 2];

        // Keep particles on sphere surface
        const x = positionsArray[i * 3];
        const y = positionsArray[i * 3 + 1];
        const z = positionsArray[i * 3 + 2];
        const dist = Math.sqrt(x * x + y * y + z * z);
        const targetDist = 2 + Math.sin(Date.now() * 0.001 + i) * 0.2;

        positionsArray[i * 3] = (x / dist) * targetDist;
        positionsArray[i * 3 + 1] = (y / dist) * targetDist;
        positionsArray[i * 3 + 2] = (z / dist) * targetDist;
      }

      particlesRef.current.geometry.attributes.position.needsUpdate = true;
      particlesRef.current.rotation.y += 0.001;
    }
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.03}
        color={color}
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  );
}

// ============================================
// NEURAL CONNECTIONS (LINES)
// ============================================

interface NeuralConnectionsProps {
  nodeCount: number;
  color: string;
}

function NeuralConnections({ nodeCount, color }: NeuralConnectionsProps) {
  const linesRef = useRef<THREE.LineSegments>(null);

  const [positions, indices] = useMemo(() => {
    const positions = new Float32Array(nodeCount * 3);
    const indices: number[] = [];

    // Create nodes on sphere
    for (let i = 0; i < nodeCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const radius = 1.8;

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);
    }

    // Connect nearby nodes
    for (let i = 0; i < nodeCount; i++) {
      for (let j = i + 1; j < nodeCount; j++) {
        const dx = positions[i * 3] - positions[j * 3];
        const dy = positions[i * 3 + 1] - positions[j * 3 + 1];
        const dz = positions[i * 3 + 2] - positions[j * 3 + 2];
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (dist < 1.0) {
          indices.push(i, j);
        }
      }
    }

    return [positions, new Uint16Array(indices)];
  }, [nodeCount]);

  useFrame(({ clock }) => {
    if (linesRef.current) {
      linesRef.current.rotation.y = clock.getElapsedTime() * 0.05;
      linesRef.current.rotation.x = Math.sin(clock.getElapsedTime() * 0.1) * 0.1;
    }
  });

  return (
    <lineSegments ref={linesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="index"
          args={[indices, 1]}
        />
      </bufferGeometry>
      <lineBasicMaterial color={color} transparent opacity={0.3} />
    </lineSegments>
  );
}

// ============================================
// MAIN 3D ORBS SCENE
// ============================================

interface OrbSceneProps {
  primaryColor: string;
  secondaryColor: string;
  isActive: boolean;
  showParticles: boolean;
  showConnections: boolean;
}

function OrbScene({
  primaryColor,
  secondaryColor,
  isActive,
  showParticles,
  showConnections,
}: OrbSceneProps) {
  return (
    <>
      <ambientLight intensity={0.4} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color={primaryColor} />

      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
        <NeuralOrbMesh
          color1={primaryColor}
          color2={secondaryColor}
          isActive={isActive}
          distortion={0.1}
        />
      </Float>

      {showParticles && <NeuralParticles count={200} color={primaryColor} />}
      {showConnections && <NeuralConnections nodeCount={50} color={primaryColor} />}
    </>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export interface NeuralOrb3DProps {
  primaryColor?: string;
  secondaryColor?: string;
  size?: number;
  isActive?: boolean;
  showParticles?: boolean;
  showConnections?: boolean;
  className?: string;
  onClick?: () => void;
}

export function NeuralOrb3D({
  primaryColor = '#3B82F6',
  secondaryColor = '#8B5CF6',
  size = 300,
  isActive = false,
  showParticles = true,
  showConnections = true,
  className = '',
  onClick,
}: NeuralOrb3DProps) {
  const prefersReducedMotion = useReducedMotion();
  const [isHovered, setIsHovered] = useState(false);

  // Fallback for reduced motion preference
  if (prefersReducedMotion) {
    return (
      <div
        className={`relative ${className}`}
        style={{ width: size, height: size }}
        onClick={onClick}
      >
        <div
          className="absolute inset-0 rounded-full cursor-pointer transition-transform hover:scale-105"
          style={{
            background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
            boxShadow: `0 0 60px ${primaryColor}40`,
          }}
        />
      </div>
    );
  }

  return (
    <div
      className={`relative cursor-pointer ${className}`}
      style={{ width: size, height: size }}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Canvas
        camera={{ position: [0, 0, 5], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <OrbScene
          primaryColor={primaryColor}
          secondaryColor={secondaryColor}
          isActive={isActive || isHovered}
          showParticles={showParticles}
          showConnections={showConnections}
        />
      </Canvas>
    </div>
  );
}

export default NeuralOrb3D;
