'use client';

import * as THREE from 'three';
import { useRouter } from 'next/navigation';
import { memo, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, createPortal, useFrame, useThree, ThreeElements } from '@react-three/fiber';
import {
  MeshTransmissionMaterial,
  Preload,
  Scroll,
  ScrollControls,
  Text,
  useFBO,
  useScroll
} from '@react-three/drei';
import { easing } from 'maath';

type Mode = 'lens' | 'bar' | 'cube';

type ModeProps = Record<string, unknown>;

type MeshProps = ThreeElements['mesh'];

interface NavItem {
  label: string;
  link: string;
}

interface FluidGlassProps {
  mode?: Mode;
  lensProps?: ModeProps;
  barProps?: ModeProps;
  cubeProps?: ModeProps;
}

interface ModeWrapperProps extends MeshProps {
  children?: ReactNode;
  geometry: THREE.BufferGeometry;
  lockToBottom?: boolean;
  followPointer?: boolean;
  modeProps?: ModeProps;
}

export default function FluidGlass({
  mode = 'lens',
  lensProps = {},
  barProps = {},
  cubeProps = {}
}: FluidGlassProps) {
  const Wrapper = mode === 'bar' ? Bar : mode === 'cube' ? Cube : Lens;
  const rawOverrides = mode === 'bar' ? barProps : mode === 'cube' ? cubeProps : lensProps;

  const {
    navItems = [
      { label: 'Start', link: '/start' },
      { label: 'Dashboard', link: '/dashboard' },
      { label: 'Journal', link: '/journal/new' }
    ],
    ...modeProps
  } = rawOverrides as { navItems?: NavItem[] } & ModeProps;

  return (
    <Canvas camera={{ position: [0, 0, 20], fov: 15 }} gl={{ alpha: true }}>
      <ScrollControls damping={0.2} pages={2.8} distance={0.4}>
        {mode === 'bar' && <NavItems items={navItems as NavItem[]} />}
        <Wrapper modeProps={modeProps}>
          <Scroll>
            <Typography />
            <BackdropPanels />
          </Scroll>
          <Scroll html />
          <Preload />
        </Wrapper>
      </ScrollControls>
    </Canvas>
  );
}

const ModeWrapper = memo(function ModeWrapper({
  children,
  geometry,
  lockToBottom = false,
  followPointer = true,
  modeProps = {},
  ...props
}: ModeWrapperProps) {
  const ref = useRef<THREE.Mesh>(null!);
  const buffer = useFBO();
  const { viewport: vp } = useThree();
  const [scene] = useState(() => new THREE.Scene());
  const geoWidthRef = useRef(1);

  useEffect(() => {
    geometry.computeBoundingBox();
    const bbox = geometry.boundingBox;
    geoWidthRef.current = bbox ? bbox.max.x - bbox.min.x || 1 : 1;

    return () => {
      geometry.dispose();
    };
  }, [geometry]);

  useFrame((state, delta) => {
    const { gl, viewport, pointer, camera } = state;
    const v = viewport.getCurrentViewport(camera, [0, 0, 15]);

    const destX = followPointer ? (pointer.x * v.width) / 2 : 0;
    const destY = lockToBottom ? -v.height / 2 + 0.2 : followPointer ? (pointer.y * v.height) / 2 : 0;
    easing.damp3(ref.current.position, [destX, destY, 15], 0.15, delta);

    if ((modeProps as { scale?: number }).scale == null) {
      const maxWorld = v.width * 0.9;
      const desired = maxWorld / geoWidthRef.current;
      const safeScale = Math.min(0.18, desired);
      ref.current.scale.setScalar(safeScale);
    }

    gl.setRenderTarget(buffer);
    gl.render(scene, camera);
    gl.setRenderTarget(null);
    gl.setClearColor(0x2b2141, 1);
  });

  const { scale, ior, thickness, anisotropy, chromaticAberration, ...extraMat } = modeProps as {
    scale?: number;
    ior?: number;
    thickness?: number;
    anisotropy?: number;
    chromaticAberration?: number;
    [key: string]: unknown;
  };

  return (
    <>
      {createPortal(children, scene)}
      <mesh scale={[vp.width, vp.height, 1]}>
        <planeGeometry />
        <meshBasicMaterial map={buffer.texture} transparent />
      </mesh>
      <mesh
        ref={ref}
        geometry={geometry}
        rotation={[Math.PI / 2, 0, 0]}
        scale={scale ?? 0.16}
        {...props}
      >
        <MeshTransmissionMaterial
          buffer={buffer.texture}
          ior={ior ?? 1.15}
          thickness={thickness ?? 5}
          anisotropy={anisotropy ?? 0.01}
          chromaticAberration={chromaticAberration ?? 0.1}
          {...(typeof extraMat === 'object' && extraMat !== null ? extraMat : {})}
        />
      </mesh>
    </>
  );
});

ModeWrapper.displayName = 'ModeWrapper';

function Lens({ modeProps, ...props }: { modeProps?: ModeProps } & MeshProps) {
  const geometry = useMemo(() => new THREE.SphereGeometry(4.5, 128, 128), []);
  return <ModeWrapper geometry={geometry} followPointer modeProps={modeProps} {...props} />;
}

function Cube({ modeProps, ...props }: { modeProps?: ModeProps } & MeshProps) {
  const geometry = useMemo(() => new THREE.BoxGeometry(6, 6, 6, 10, 10, 10), []);
  return <ModeWrapper geometry={geometry} followPointer modeProps={modeProps} {...props} />;
}

function Bar({ modeProps = {}, ...props }: { modeProps?: ModeProps } & MeshProps) {
  const geometry = useMemo(() => new THREE.BoxGeometry(10, 1.6, 3, 16, 4, 8), []);
  const defaultMat = {
    transmission: 1,
    roughness: 0,
    thickness: 10,
    ior: 1.15,
    color: '#ffffff',
    attenuationColor: '#ffffff',
    attenuationDistance: 0.25
  };

  return (
    <ModeWrapper
      geometry={geometry}
      lockToBottom
      followPointer={false}
      modeProps={{ ...defaultMat, ...modeProps }}
      {...props}
    />
  );
}

function NavItems({ items }: { items: NavItem[] }) {
  const group = useRef<THREE.Group>(null!);
  const { viewport, camera } = useThree();
  const router = useRouter();

  const DEVICE = {
    mobile: { max: 639, spacing: 0.25, fontSize: 0.038 },
    tablet: { max: 1023, spacing: 0.28, fontSize: 0.048 },
    desktop: { max: Infinity, spacing: 0.34, fontSize: 0.048 }
  } as const;

  const getDevice = useCallback(() => {
    const width = window.innerWidth;
    return width <= DEVICE.mobile.max ? 'mobile' : width <= DEVICE.tablet.max ? 'tablet' : 'desktop';
  }, []);

  const [device, setDevice] = useState<keyof typeof DEVICE>(() => getDevice());

  useEffect(() => {
    const onResize = () => setDevice(getDevice());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [getDevice]);

  const { spacing, fontSize } = DEVICE[device];

  useFrame(() => {
    if (!group.current) return;
    const v = viewport.getCurrentViewport(camera, [0, 0, 15]);
    group.current.position.set(0, -v.height / 2 + 0.2, 15.1);

    group.current.children.forEach((child, index) => {
      child.position.x = (index - (items.length - 1) / 2) * spacing;
    });
  });

  const handleNavigate = (link: string) => {
    if (!link) return;
    if (link.startsWith('http')) {
      window.open(link, '_blank', 'noopener,noreferrer');
      return;
    }

    if (link.startsWith('#')) {
      const target = document.querySelector(link);
      target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    router.push(link);
  };

  return (
    <group ref={group} renderOrder={10}>
      {items.map(({ label, link }) => (
        <Text
          key={label}
          fontSize={fontSize}
          color="white"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0}
          outlineBlur="20%"
          outlineColor="#000"
          outlineOpacity={0.5}
          renderOrder={10}
          onClick={event => {
            event.stopPropagation();
            handleNavigate(link);
          }}
          onPointerOver={() => (document.body.style.cursor = 'pointer')}
          onPointerOut={() => (document.body.style.cursor = 'auto')}
        >
          {label}
        </Text>
      ))}
    </group>
  );
}

function BackdropPanels() {
  const group = useRef<THREE.Group>(null!);
  const data = useScroll();
  const { height } = useThree(state => state.viewport);

  const panels = useMemo(
    () => [
      {
        key: 'panel-1',
        position: [-2.2, 0, 0],
        size: [3.2, height / 1.05],
        color: '#4c1d95',
        range: [0, 0.4] as [number, number],
        speed: 0.6
      },
      {
        key: 'panel-2',
        position: [2.4, 0.2, 2.6],
        size: [2.8, height / 1.4],
        color: '#7c3aed',
        range: [0.2, 0.6] as [number, number],
        speed: 0.8
      },
      {
        key: 'panel-3',
        position: [-1.4, -height, 5],
        size: [1.4, height / 1.6],
        color: '#22d3ee',
        range: [0.6, 0.9] as [number, number],
        speed: 1.1
      },
      {
        key: 'panel-4',
        position: [0.6, -height * 1.2, 7.2],
        size: [1.8, height / 1.8],
        color: '#9333ea',
        range: [0.6, 1] as [number, number],
        speed: 1.35
      },
      {
        key: 'panel-5',
        position: [1.6, -height * 1.5, 9],
        size: [1.2, height / 2],
        color: '#2dd4bf',
        range: [0.7, 1] as [number, number],
        speed: 1.5
      }
    ],
    [height]
  );

  useFrame((_, delta) => {
    if (!group.current) return;

    panels.forEach((panel, index) => {
      const mesh = group.current.children[index] as THREE.Mesh;
      if (!mesh) return;

      const scrollBoost = data.range(panel.range[0], panel.range[1]);
      const targetY = panel.position[1] + data.offset * -height * panel.speed;
      easing.damp3(mesh.position, [panel.position[0], targetY, panel.position[2]], 0.25, delta);

      const baseScale = panel.size;
      const scaleMultiplier = 1 + scrollBoost * 0.35;
      easing.damp3(mesh.scale, [baseScale[0] * scaleMultiplier, baseScale[1] * scaleMultiplier, 1], 0.3, delta);
    });
  });

  return (
    <group ref={group}>
      {panels.map(panel => (
        <mesh key={panel.key} position={panel.position as [number, number, number]}>
          <planeGeometry args={[1, 1, 1, 1]} />
          <meshBasicMaterial color={panel.color} />
        </mesh>
      ))}
    </group>
  );
}

function Typography() {
  const DEVICE = {
    mobile: { fontSize: 0.22 },
    tablet: { fontSize: 0.42 },
    desktop: { fontSize: 0.64 }
  } as const;

  const getDevice = useCallback(() => {
    const width = window.innerWidth;
    return width <= 639 ? 'mobile' : width <= 1023 ? 'tablet' : 'desktop';
  }, []);

  const [device, setDevice] = useState<keyof typeof DEVICE>(() => getDevice());

  useEffect(() => {
    const onResize = () => setDevice(getDevice());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [getDevice]);

  const { fontSize } = DEVICE[device];

  return (
    <Text
      position={[0, 0.15, 12]}
      fontSize={fontSize}
      letterSpacing={-0.05}
      outlineWidth={0}
      outlineBlur="20%"
      outlineColor="#000"
      outlineOpacity={0.5}
      color="white"
      anchorX="center"
      anchorY="middle"
    >
      Neural Adapt
    </Text>
  );
}
