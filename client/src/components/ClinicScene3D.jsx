import { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Text, RoundedBox, Float } from '@react-three/drei';

const STATUS_COLORS = {
  AVAILABLE: '#10b981',
  OCCUPIED: '#ef4444',
  CLEANING: '#3b82f6',
  MAINTENANCE: '#f59e0b',
};

const FLOOR_MARBLE = '#f5f0eb';
const FLOOR_MARBLE2 = '#ebe5dd';
const WALL_COLOR = '#e8edf5';
const WOOD = '#c4a882';
const WOOD_DARK = '#a08060';
const CLINICAL_WHITE = '#e8e8e8';
const METAL = '#888888';
const SCREEN_GREEN = '#22c55e';
const SCREEN_BLUE = '#3b82f6';
const SINK_COLOR = '#dde4ee';

/* ─── MARBLE TILE FLOOR ─── */
function Floor() {
  const tiles = useMemo(() => {
    const t = [];
    for (let x = -10; x < 10; x++) {
      for (let z = -7; z < 7; z++) {
        t.push({ x, z, color: (x + z) % 2 === 0 ? FLOOR_MARBLE : FLOOR_MARBLE2 });
      }
    }
    return t;
  }, []);
  return (
    <group>
      {tiles.map((t, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[t.x + 0.5, -0.01, t.z + 0.5]} receiveShadow>
          <planeGeometry args={[1, 1]} />
          <meshStandardMaterial color={t.color} roughness={0.3} metalness={0.05} />
        </mesh>
      ))}
    </group>
  );
}

/* ─── WALLS ─── */
function Walls() {
  const wallMat = { color: WALL_COLOR, roughness: 0.6, metalness: 0.05 };
  const trimMat = { color: '#d5dce8', roughness: 0.5, metalness: 0.05 };
  return (
    <group>
      {/* Back wall */}
      <mesh position={[0, 1.2, -7]} castShadow receiveShadow>
        <boxGeometry args={[20, 2.4, 0.12]} />
        <meshStandardMaterial {...wallMat} />
      </mesh>
      {/* Back wall trim (baseboard) */}
      <mesh position={[0, 0.08, -6.94]}>
        <boxGeometry args={[20, 0.16, 0.04]} />
        <meshStandardMaterial {...trimMat} />
      </mesh>
      {/* Back wall trim (top rail) */}
      <mesh position={[0, 2.32, -6.94]}>
        <boxGeometry args={[20, 0.16, 0.04]} />
        <meshStandardMaterial {...trimMat} />
      </mesh>
      {/* Left wall */}
      <mesh position={[-10, 1.2, 0]} rotation={[0, Math.PI / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[14, 2.4, 0.12]} />
        <meshStandardMaterial {...wallMat} />
      </mesh>
      {/* Left wall trim (baseboard) */}
      <mesh position={[-9.94, 0.08, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[14, 0.16, 0.04]} />
        <meshStandardMaterial {...trimMat} />
      </mesh>
      {/* Left wall trim (top rail) */}
      <mesh position={[-9.94, 2.32, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[14, 0.16, 0.04]} />
        <meshStandardMaterial {...trimMat} />
      </mesh>
      {/* Right wall */}
      <mesh position={[10, 1.2, 0]} rotation={[0, Math.PI / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[14, 2.4, 0.12]} />
        <meshStandardMaterial {...wallMat} />
      </mesh>
      {/* Right wall trim (baseboard) */}
      <mesh position={[9.94, 0.08, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[14, 0.16, 0.04]} />
        <meshStandardMaterial {...trimMat} />
      </mesh>
      {/* Right wall trim (top rail) */}
      <mesh position={[9.94, 2.32, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[14, 0.16, 0.04]} />
        <meshStandardMaterial {...trimMat} />
      </mesh>
    </group>
  );
}

/* ─── WALK-IN KIOSK (outside entrance) ─── */
function WalkInKiosk() {
  return (
    <group position={[3.5, 0, 8.2]}>
      {/* Canopy */}
      <mesh position={[0, 2.4, 0]} castShadow>
        <boxGeometry args={[3, 0.08, 2]} />
        <meshStandardMaterial color="#334155" roughness={0.6} />
      </mesh>
      {/* Canopy supports */}
      {[-1.3, 1.3].map((x, i) => (
        <mesh key={i} position={[x, 1.2, 0.9]} castShadow>
          <cylinderGeometry args={[0.04, 0.04, 2.4, 8]} />
          <meshStandardMaterial color="#64748b" metalness={0.7} />
        </mesh>
      ))}
      {/* Kiosk body */}
      <RoundedBox args={[1.2, 1.6, 0.6]} radius={0.05} position={[0, 0.8, 0.3]} castShadow receiveShadow>
        <meshStandardMaterial color="#1e293b" roughness={0.4} />
      </RoundedBox>
      {/* Screen */}
      <mesh position={[0, 1.2, 0.61]}>
        <planeGeometry args={[1.0, 0.7]} />
        <meshStandardMaterial color={SCREEN_BLUE} emissive={SCREEN_BLUE} emissiveIntensity={0.6} />
      </mesh>
      {/* Screen text */}
      <Text position={[0, 1.25, 0.62]} fontSize={0.22} color="#ffffff" fontWeight="bold">
        DentAssist
      </Text>
      <Text position={[0, 1.08, 0.62]} fontSize={0.3} color="#ffffff">
        Walk-In Kiosk
      </Text>
      {/* Base */}
      <mesh position={[0, 0.05, 0.3]}>
        <boxGeometry args={[1.4, 0.1, 0.8]} />
        <meshStandardMaterial color="#475569" roughness={0.5} />
      </mesh>
    </group>
  );
}

/* ─── RECEPTION DESK ─── */
function ReceptionDesk() {
  return (
    <group position={[0, 0, -5.5]}>
      {/* Main desk - L-shape */}
      <RoundedBox args={[5, 0.9, 1.2]} radius={0.05} position={[0, 0.45, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={WOOD} roughness={0.5} />
      </RoundedBox>
      <RoundedBox args={[1.2, 0.9, 2]} radius={0.05} position={[-1.9, 0.45, 0.9]} castShadow receiveShadow>
        <meshStandardMaterial color={WOOD} roughness={0.5} />
      </RoundedBox>
      {/* Counter top */}
      <mesh position={[0, 0.92, 0]} receiveShadow>
        <boxGeometry args={[5.1, 0.04, 1.3]} />
        <meshStandardMaterial color="#d4c8b8" roughness={0.3} />
      </mesh>
      {/* Computer monitor */}
      <mesh position={[-1.5, 1.3, -0.2]}>
        <boxGeometry args={[0.5, 0.35, 0.03]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      <mesh position={[-1.5, 1.05, -0.2]}>
        <boxGeometry args={[0.06, 0.22, 0.06]} />
        <meshStandardMaterial color={METAL} metalness={0.6} />
      </mesh>
      {/* Monitor screen */}
      <mesh position={[-1.5, 1.3, -0.18]}>
        <planeGeometry args={[0.44, 0.29]} />
        <meshStandardMaterial color="#0ea5e9" emissive="#0ea5e9" emissiveIntensity={0.3} />
      </mesh>
      {/* Reception sign */}
      <Text position={[0, 1.5, 0]} fontSize={0.28} color="#0369a1" fontWeight="bold">
        RECEPTION
      </Text>
      {/* Chair behind desk */}
      <RoundedBox args={[0.5, 0.5, 0.5]} radius={0.1} position={[0, 0.25, -1]} castShadow>
        <meshStandardMaterial color="#334155" />
      </RoundedBox>
      <mesh position={[0, 0.6, -1]}>
        <boxGeometry args={[0.5, 0.4, 0.06]} />
        <meshStandardMaterial color="#334155" />
      </mesh>
      {/* RFID Scanner */}
      <mesh position={[2, 0.95, 0.3]}>
        <boxGeometry args={[0.15, 0.02, 0.15]} />
        <meshStandardMaterial color={METAL} metalness={0.8} />
      </mesh>
      <Float speed={3} floatIntensity={0.2}>
        <mesh position={[2, 1.05, 0.3]}>
          <sphereGeometry args={[0.03, 8, 8]} />
          <meshStandardMaterial color={SCREEN_GREEN} emissive={SCREEN_GREEN} emissiveIntensity={1} />
        </mesh>
      </Float>
    </group>
  );
}

/* ─── WAITING AREA ─── */
function WaitingArea({ queue }) {
  const waitingCount = queue.filter(q => q.status === 'WAITING').length;
  const seats = [
    [-3.5, -3.5], [-2, -3.5], [-0.5, -3.5], [1, -3.5],
    [-3.5, -4.8], [-2, -4.8], [-0.5, -4.8], [1, -4.8],
  ];

  return (
    <group>
      {/* Waiting zone floor highlight */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, -4.15]} receiveShadow>
        <planeGeometry args={[7, 3]} />
        <meshStandardMaterial color="#fef9ef" roughness={0.4} />
      </mesh>

      {/* Sofas */}
      {seats.map(([x, z], i) => {
        const occupied = i < waitingCount;
        return (
          <group key={i} position={[x, 0, z]}>
            <RoundedBox args={[1.1, 0.35, 0.9]} radius={0.06} position={[0, 0.18, 0]} castShadow receiveShadow>
              <meshStandardMaterial color={occupied ? '#fbbf24' : '#d1cfc8'} roughness={0.7} />
            </RoundedBox>
            {/* Sofa back */}
            <RoundedBox args={[1.1, 0.3, 0.1]} radius={0.03} position={[0, 0.4, -0.4]} castShadow>
              <meshStandardMaterial color={occupied ? '#d97706' : '#b8b5ac'} roughness={0.7} />
            </RoundedBox>
            {occupied && (
              <Float speed={1.5} floatIntensity={0.12}>
                <mesh position={[0, 0.7, 0]}>
                  <sphereGeometry args={[0.14, 12, 12]} />
                  <meshStandardMaterial color="#f59e0b" />
                </mesh>
              </Float>
            )}
          </group>
        );
      })}

      {/* Coffee table */}
      <RoundedBox args={[1.5, 0.25, 0.6]} radius={0.04} position={[-1.25, 0.13, -4.15]} castShadow receiveShadow>
        <meshStandardMaterial color={WOOD_DARK} roughness={0.5} />
      </RoundedBox>

      {/* Indoor plant */}
      <group position={[3.2, 0, -5.2]}>
        <mesh position={[0, 0.2, 0]}>
          <cylinderGeometry args={[0.2, 0.15, 0.4, 8]} />
          <meshStandardMaterial color="#78716c" roughness={0.8} />
        </mesh>
        {[0, 1, 2, 3, 4].map(i => (
          <mesh key={i} position={[Math.sin(i * 1.3) * 0.15, 0.6 + i * 0.1, Math.cos(i * 1.3) * 0.15]}>
            <sphereGeometry args={[0.12, 8, 8]} />
            <meshStandardMaterial color="#22c55e" roughness={0.8} />
          </mesh>
        ))}
      </group>

      {/* Queue display TV */}
      <group position={[3.5, 1.8, -3.5]}>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[1.2, 0.7, 0.04]} />
          <meshStandardMaterial color="#0f172a" />
        </mesh>
        <mesh position={[0, 0, 0.025]}>
          <planeGeometry args={[1.1, 0.6]} />
          <meshStandardMaterial color={SCREEN_GREEN} emissive={SCREEN_GREEN} emissiveIntensity={0.4} />
        </mesh>
        <Text position={[0, 0.1, 0.03]} fontSize={0.3} color="#ffffff" fontWeight="bold">
          QUEUE STATUS
        </Text>
        <Text position={[0, -0.08, 0.03]} fontSize={0.24} color="#ffffff">
          #{waitingCount > 0 ? '1' : '—'}
        </Text>
        {/* TV mount */}
        <mesh position={[0, -0.5, -0.02]}>
          <boxGeometry args={[0.08, 0.3, 0.08]} />
          <meshStandardMaterial color={METAL} metalness={0.6} />
        </mesh>
      </group>
    </group>
  );
}

/* ─── CONSULTATION ROOM ─── */
function ConsultationRoom() {
  return (
    <group position={[7.5, 0, -4.5]}>
      {/* Room floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} receiveShadow>
        <planeGeometry args={[4.5, 4]} />
        <meshStandardMaterial color="#f0f5ff" roughness={0.4} />
      </mesh>
      {/* Room label */}
      <Text position={[0, 2.2, -1.8]} fontSize={0.28} color="#0369a1" fontWeight="bold">
        CONSULTATION
      </Text>
      {/* Desk */}
      <RoundedBox args={[1.5, 0.75, 0.8]} radius={0.03} position={[0, 0.375, -0.8]} castShadow receiveShadow>
        <meshStandardMaterial color={WOOD} roughness={0.5} />
      </RoundedBox>
      {/* Computer on desk */}
      <mesh position={[0, 0.9, -1]}>
        <boxGeometry args={[0.4, 0.28, 0.02]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      <mesh position={[0, 0.9, -0.99]}>
        <planeGeometry args={[0.36, 0.24]} />
        <meshStandardMaterial color="#0ea5e9" emissive="#0ea5e9" emissiveIntensity={0.3} />
      </mesh>
      {/* Patient chair */}
      <RoundedBox args={[0.6, 0.4, 0.6]} radius={0.08} position={[0, 0.2, 0.5]} castShadow receiveShadow>
        <meshStandardMaterial color="#94a3b8" roughness={0.6} />
      </RoundedBox>
      <RoundedBox args={[0.55, 0.5, 0.08]} radius={0.04} position={[0, 0.55, 0.18]} castShadow>
        <meshStandardMaterial color="#94a3b8" roughness={0.6} />
      </RoundedBox>
      {/* Dentist stool */}
      <RoundedBox args={[0.35, 0.3, 0.35]} radius={0.08} position={[1.2, 0.15, 0]} castShadow>
        <meshStandardMaterial color="#475569" />
      </RoundedBox>
      <mesh position={[1.2, 0.05, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 0.1, 8]} />
        <meshStandardMaterial color={METAL} metalness={0.7} />
      </mesh>
      {/* Monitor on arm */}
      <mesh position={[-1.2, 1.4, 0]}>
        <boxGeometry args={[0.04, 0.6, 0.04]} />
        <meshStandardMaterial color={METAL} metalness={0.6} />
      </mesh>
      <mesh position={[-1.2, 1.7, 0.3]}>
        <boxGeometry args={[0.5, 0.35, 0.02]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      <mesh position={[-1.2, 1.7, 0.32]}>
        <planeGeometry args={[0.44, 0.29]} />
        <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={0.3} />
      </mesh>
      {/* Cabinet */}
      <RoundedBox args={[0.8, 1.4, 0.5]} radius={0.02} position={[-1.8, 0.7, -1.5]} castShadow receiveShadow>
        <meshStandardMaterial color={CLINICAL_WHITE} roughness={0.4} />
      </RoundedBox>
    </group>
  );
}

/* ─── X-RAY ROOM ─── */
function XrayRoom() {
  return (
    <group position={[7.5, 0, 0.5]}>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} receiveShadow>
        <planeGeometry args={[4.5, 4]} />
        <meshStandardMaterial color="#e8e0f0" roughness={0.4} />
      </mesh>
      <Text position={[0, 2.2, -1.8]} fontSize={0.28} color="#7c3aed" fontWeight="bold">
        X-RAY ROOM
      </Text>
      {/* Panoramic X-ray machine */}
      <group position={[0, 0, -0.3]}>
        {/* Main column */}
        <mesh position={[1, 0.8, 0]} castShadow>
          <boxGeometry args={[0.2, 1.6, 0.2]} />
          <meshStandardMaterial color={METAL} metalness={0.7} roughness={0.3} />
        </mesh>
        {/* Rotating arm */}
        <mesh position={[0, 1.5, 0]} castShadow>
          <boxGeometry args={[1.8, 0.12, 0.12]} />
          <meshStandardMaterial color={CLINICAL_WHITE} metalness={0.4} />
        </mesh>
        {/* Sensor head */}
        <mesh position={[-0.8, 1.2, 0]}>
          <boxGeometry args={[0.15, 0.3, 0.15]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>
        {/* Chin rest */}
        <mesh position={[0, 0.9, 0]}>
          <boxGeometry args={[0.3, 0.05, 0.2]} />
          <meshStandardMaterial color={CLINICAL_WHITE} />
        </mesh>
        {/* Base */}
        <mesh position={[1, 0.05, 0]}>
          <cylinderGeometry args={[0.25, 0.3, 0.1, 16]} />
          <meshStandardMaterial color={METAL} metalness={0.6} />
        </mesh>
      </group>
      {/* Lead warning sign */}
      <mesh position={[-1.8, 1.5, -1.8]}>
        <boxGeometry args={[0.4, 0.3, 0.02]} />
        <meshStandardMaterial color="#eab308" emissive="#eab308" emissiveIntensity={0.2} />
      </mesh>
      <Text position={[-1.8, 1.5, -1.78]} fontSize={0.3} color="#000000" fontWeight="bold">
        X-RAY
      </Text>
    </group>
  );
}

/* ─── DENTAL TREATMENT ROOM ─── */
function TreatmentRoom({ room, position, onClick, isSelected }) {
  const color = STATUS_COLORS[room.status] || '#94a3b8';
  const appointment = room.appointments?.[0];

  return (
    <group position={position}>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} receiveShadow>
        <planeGeometry args={[5, 4.5]} />
        <meshStandardMaterial color={isSelected ? '#dbeafe' : '#f0f5ff'} roughness={0.3} />
      </mesh>

      {/* Room label */}
      <Text position={[0, 2.2, -2]} fontSize={0.28} color="#0369a1" fontWeight="bold">
        {room.name || `Room ${room.number}`}
      </Text>

      {/* Status indicator orb */}
      <Float speed={2} floatIntensity={0.15}>
        <mesh position={[0, 2.0, -1.6]}>
          <octahedronGeometry args={[0.1]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} />
        </mesh>
      </Float>

      {/* Dental chair */}
      <group position={[-0.8, 0, -0.2]}>
        {/* Base */}
        <mesh position={[0, 0.08, 0]} castShadow>
          <cylinderGeometry args={[0.35, 0.4, 0.16, 16]} />
          <meshStandardMaterial color={METAL} metalness={0.6} roughness={0.3} />
        </mesh>
        {/* Chair body */}
        <RoundedBox args={[0.55, 0.2, 1.4]} radius={0.06} position={[0, 0.28, 0]} castShadow receiveShadow>
          <meshStandardMaterial color="#dbeafe" roughness={0.6} />
        </RoundedBox>
        {/* Chair back (reclined) */}
        <RoundedBox args={[0.5, 0.7, 0.08]} radius={0.04} position={[0, 0.55, -0.55]} rotation={[0.3, 0, 0]} castShadow>
          <meshStandardMaterial color="#dbeafe" roughness={0.6} />
        </RoundedBox>
        {/* Headrest */}
        <RoundedBox args={[0.3, 0.15, 0.2]} radius={0.05} position={[0, 0.85, -0.85]} rotation={[0.3, 0, 0]} castShadow>
          <meshStandardMaterial color="#bfdbfe" roughness={0.6} />
        </RoundedBox>
        {/* Armrests */}
        {[-0.35, 0.35].map((x, i) => (
          <RoundedBox key={i} args={[0.08, 0.08, 0.4]} radius={0.02} position={[x, 0.38, 0.1]} castShadow>
            <meshStandardMaterial color="#94a3b8" />
          </RoundedBox>
        ))}
      </group>

      {/* Overhead examination light */}
      <group position={[-0.8, 2.0, -0.2]}>
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 0.3, 8]} />
          <meshStandardMaterial color={METAL} metalness={0.8} />
        </mesh>
        <mesh position={[0, -0.2, 0]}>
          <sphereGeometry args={[0.12, 12, 12]} />
          <meshStandardMaterial color="#fef3c7" emissive="#fef3c7" emissiveIntensity={room.status === 'OCCUPIED' ? 0.8 : 0.1} />
        </mesh>
        {room.status === 'OCCUPIED' && (
          <pointLight position={[0, -0.3, 0]} intensity={0.5} color="#fef3c7" distance={3} />
        )}
      </group>

      {/* Delivery unit */}
      <group position={[1.5, 0, -1]}>
        <RoundedBox args={[0.6, 0.9, 0.5]} radius={0.03} position={[0, 0.45, 0]} castShadow receiveShadow>
          <meshStandardMaterial color={CLINICAL_WHITE} roughness={0.4} />
        </RoundedBox>
        {/* Instrument trays */}
        <mesh position={[0, 0.95, 0]}>
          <cylinderGeometry args={[0.2, 0.2, 0.02, 16]} />
          <meshStandardMaterial color={METAL} metalness={0.7} />
        </mesh>
      </group>

      {/* Dentist stool */}
      <group position={[0.8, 0, 1]}>
        <mesh position={[0, 0.05, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 0.1, 8]} />
          <meshStandardMaterial color={METAL} metalness={0.7} />
        </mesh>
        <RoundedBox args={[0.35, 0.08, 0.35]} radius={0.06} position={[0, 0.15, 0]} castShadow>
          <meshStandardMaterial color="#475569" />
        </RoundedBox>
        <mesh position={[0, 0.04, 0]}>
          <cylinderGeometry args={[0.18, 0.18, 0.02, 16]} />
          <meshStandardMaterial color={METAL} metalness={0.6} />
        </mesh>
      </group>

      {/* Assistant stool */}
      <group position={[-1.8, 0, 0.8]}>
        <mesh position={[0, 0.05, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 0.1, 8]} />
          <meshStandardMaterial color={METAL} metalness={0.7} />
        </mesh>
        <RoundedBox args={[0.3, 0.06, 0.3]} radius={0.06} position={[0, 0.12, 0]} castShadow>
          <meshStandardMaterial color="#64748b" />
        </RoundedBox>
      </group>

      {/* Computer monitor */}
      <group position={[2, 0, 0.5]}>
        <mesh position={[0, 1.1, 0]}>
          <boxGeometry args={[0.04, 0.4, 0.04]} />
          <meshStandardMaterial color={METAL} metalness={0.6} />
        </mesh>
        <mesh position={[0, 1.35, 0.1]}>
          <boxGeometry args={[0.45, 0.3, 0.02]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>
        <mesh position={[0, 1.35, 0.12]}>
          <planeGeometry args={[0.4, 0.25]} />
          <meshStandardMaterial color="#0ea5e9" emissive="#0ea5e9" emissiveIntensity={0.3} />
        </mesh>
      </group>

      {/* Cabinetry */}
      <RoundedBox args={[1.2, 1.2, 0.5]} radius={0.02} position={[-2, 0.6, -2]} castShadow receiveShadow>
        <meshStandardMaterial color={CLINICAL_WHITE} roughness={0.4} />
      </RoundedBox>
      {/* Cabinet doors */}
      <mesh position={[-2, 0.8, -1.74]}>
        <planeGeometry args={[0.55, 1.0]} />
        <meshStandardMaterial color="#d4d8e0" roughness={0.4} />
      </mesh>
      <mesh position={[-2, 0.8, -1.73]}>
        <boxGeometry args={[0.02, 0.04, 0.02]} />
        <meshStandardMaterial color={METAL} metalness={0.8} />
      </mesh>

      {/* Sink */}
      <group position={[2, 0, -2]}>
        <RoundedBox args={[0.6, 0.05, 0.4]} radius={0.02} position={[0, 0.85, 0]} castShadow>
          <meshStandardMaterial color={SINK_COLOR} roughness={0.3} />
        </RoundedBox>
        <mesh position={[0, 0.82, 0]}>
          <boxGeometry args={[0.4, 0.1, 0.25]} />
          <meshStandardMaterial color="#b8c8e0" roughness={0.2} />
        </mesh>
        {/* Faucet */}
        <mesh position={[0, 1.0, -0.15]}>
          <cylinderGeometry args={[0.02, 0.02, 0.25, 8]} />
          <meshStandardMaterial color={METAL} metalness={0.8} />
        </mesh>
        <mesh position={[0, 1.1, -0.08]} rotation={[0.5, 0, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 0.15, 8]} />
          <meshStandardMaterial color={METAL} metalness={0.8} />
        </mesh>
      </group>

      {/* Clickable overlay */}
      <RoundedBox
        args={[5, 2.2, 4.5]}
        radius={0.05}
        position={[0, 1.1, 0]}
        onClick={(e) => { e.stopPropagation(); onClick(room); }}
        onPointerOver={(e) => { document.body.style.cursor = 'pointer'; }}
        onPointerOut={(e) => { document.body.style.cursor = 'default'; }}
      >
        <meshStandardMaterial color={color} transparent opacity={isSelected ? 0.08 : 0.02} />
      </RoundedBox>

      {/* Patient info when occupied */}
      {room.status === 'OCCUPIED' && appointment && (
        <Text position={[0, 1.8, 0]} fontSize={0.22} color="#1e293b" maxWidth={4} textAlign="center">
          {`${appointment.patient?.user?.name || 'Patient'} — ${appointment.reason || ''}`}
        </Text>
      )}
    </group>
  );
}

/* ─── STERILIZATION ROOM ─── */
function SterilizationRoom() {
  return (
    <group position={[-7, 0, 0.5]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} receiveShadow>
        <planeGeometry args={[5.5, 4]} />
        <meshStandardMaterial color="#f0fdf4" roughness={0.4} />
      </mesh>
      <Text position={[0, 2.2, -1.8]} fontSize={0.28} color="#16a34a" fontWeight="bold">
        STERILIZATION
      </Text>
      {/* Dirty zone */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-1.2, 0.03, 0]} receiveShadow>
        <planeGeometry args={[2.5, 3.5]} />
        <meshStandardMaterial color="#fef2f2" roughness={0.4} />
      </mesh>
      <Text position={[-1.2, 0.06, -1.5]} fontSize={0.1} color="#dc2626">
        DIRTY ZONE
      </Text>
      {/* Clean zone */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[1.2, 0.03, 0]} receiveShadow>
        <planeGeometry args={[2.5, 3.5]} />
        <meshStandardMaterial color="#f0fdf4" roughness={0.4} />
      </mesh>
      <Text position={[1.2, 0.06, -1.5]} fontSize={0.1} color="#16a34a">
        CLEAN ZONE
      </Text>
      {/* Ultrasonic cleaner */}
      <RoundedBox args={[0.7, 0.5, 0.6]} radius={0.03} position={[-1.5, 0.25, -0.5]} castShadow receiveShadow>
        <meshStandardMaterial color={CLINICAL_WHITE} roughness={0.4} />
      </RoundedBox>
      <Text position={[-1.5, 0.55, -0.5]} fontSize={0.3} color="#334155">
        Ultrasonic
      </Text>
      {/* Autoclave */}
      <RoundedBox args={[0.8, 0.9, 0.7]} radius={0.04} position={[0.8, 0.45, -0.8]} castShadow receiveShadow>
        <meshStandardMaterial color={METAL} metalness={0.5} roughness={0.4} />
      </RoundedBox>
      <mesh position={[0.8, 0.5, -0.44]}>
        <circleGeometry args={[0.15, 16]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      <Text position={[0.8, 0.95, -0.8]} fontSize={0.3} color="#334155">
        Autoclave
      </Text>
      {/* Drying station */}
      <RoundedBox args={[0.8, 0.7, 0.5]} radius={0.03} position={[1.5, 0.35, 0.5]} castShadow receiveShadow>
        <meshStandardMaterial color={CLINICAL_WHITE} roughness={0.4} />
      </RoundedBox>
      <Text position={[1.5, 0.75, 0.5]} fontSize={0.3} color="#334155">
        Dryer
      </Text>
      {/* Storage cabinets */}
      <RoundedBox args={[1.8, 1.4, 0.5]} radius={0.02} position={[-1.2, 0.7, 1.5]} castShadow receiveShadow>
        <meshStandardMaterial color={CLINICAL_WHITE} roughness={0.4} />
      </RoundedBox>
      <RoundedBox args={[1.8, 1.4, 0.5]} radius={0.02} position={[1.2, 0.7, 1.5]} castShadow receiveShadow>
        <meshStandardMaterial color={CLINICAL_WHITE} roughness={0.4} />
      </RoundedBox>
    </group>
  );
}

/* ─── STORAGE ROOM ─── */
function StorageRoom() {
  return (
    <group position={[-7, 0, 5]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} receiveShadow>
        <planeGeometry args={[5.5, 3]} />
        <meshStandardMaterial color="#fafaf9" roughness={0.5} />
      </mesh>
      <Text position={[0, 2.2, -1.3]} fontSize={0.3} color="#78716c" fontWeight="bold">
        SUPPLY STORAGE
      </Text>
      {/* Shelving units */}
      {[-1.5, 0, 1.5].map((x, i) => (
        <group key={i} position={[x, 0, -0.8]}>
          {[0.3, 0.7, 1.1].map((y, j) => (
            <mesh key={j} position={[0, y, 0]} castShadow receiveShadow>
              <boxGeometry args={[1.2, 0.04, 0.5]} />
              <meshStandardMaterial color={WOOD_DARK} roughness={0.6} />
            </mesh>
          ))}
          <mesh position={[0, 0.7, -0.25]}>
            <boxGeometry args={[1.2, 0.8, 0.4]} />
            <meshStandardMaterial color="#d6d3d1" roughness={0.6} transparent opacity={0.6} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/* ─── STAFF ROOM ─── */
function StaffRoom() {
  return (
    <group position={[-7, 0, -4.5]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} receiveShadow>
        <planeGeometry args={[5.5, 4]} />
        <meshStandardMaterial color="#fefce8" roughness={0.5} />
      </mesh>
      <Text position={[0, 2.2, -1.8]} fontSize={0.3} color="#a16207" fontWeight="bold">
        STAFF ROOM
      </Text>
      {/* Table */}
      <RoundedBox args={[2, 0.04, 1]} radius={0.02} position={[0, 0.72, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={WOOD} roughness={0.5} />
      </RoundedBox>
      {[[-0.8, 0, -0.6], [0.8, 0, -0.6], [-0.8, 0, 0.6], [0.8, 0, 0.6]].map(([x, y, z], i) => (
        <mesh key={i} position={[x, 0.04, z]}>
          <cylinderGeometry args={[0.03, 0.03, 0.08, 8]} />
          <meshStandardMaterial color={METAL} metalness={0.6} />
        </mesh>
      ))}
      {/* Chairs around table */}
      {[[-1.3, 0, 0], [1.3, 0, 0], [0, 0, -0.8], [0, 0, 0.8]].map(([x, y, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <RoundedBox args={[0.35, 0.06, 0.35]} radius={0.06} position={[0, 0.4, 0]} castShadow>
            <meshStandardMaterial color="#78716c" />
          </RoundedBox>
          <mesh position={[0, 0.2, 0]}>
            <cylinderGeometry args={[0.03, 0.03, 0.4, 8]} />
            <meshStandardMaterial color={METAL} metalness={0.6} />
          </mesh>
        </group>
      ))}
      {/* Pantry counter */}
      <RoundedBox args={[1.5, 0.8, 0.5]} radius={0.02} position={[-2, 0.4, -1.5]} castShadow receiveShadow>
        <meshStandardMaterial color={CLINICAL_WHITE} roughness={0.4} />
      </RoundedBox>
      {/* Lockers */}
      {[-2.2, -1.8, -1.4, -1].map((x, i) => (
        <RoundedBox key={i} args={[0.35, 1.4, 0.4]} radius={0.02} position={[x, 0.7, 1.5]} castShadow receiveShadow>
          <meshStandardMaterial color="#94a3b8" roughness={0.5} />
        </RoundedBox>
      ))}
    </group>
  );
}

/* ─── RESTROOM ─── */
function Restroom() {
  return (
    <group position={[-7, 0, 5]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} receiveShadow>
        <planeGeometry args={[3, 2.5]} />
        <meshStandardMaterial color="#f0f9ff" roughness={0.3} />
      </mesh>
      <Text position={[0, 2.2, -1.1]} fontSize={0.24} color="#0369a1" fontWeight="bold">
        RESTROOM
      </Text>
      {/* Toilet */}
      <group position={[-0.5, 0, -0.5]}>
        <mesh position={[0, 0.15, 0]}>
          <boxGeometry args={[0.3, 0.3, 0.4]} />
          <meshStandardMaterial color="#e2e8f0" roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.35, -0.15]}>
          <boxGeometry args={[0.28, 0.3, 0.06]} />
          <meshStandardMaterial color="#e2e8f0" roughness={0.3} />
        </mesh>
      </group>
      {/* Sink */}
      <group position={[0.5, 0, -0.5]}>
        <RoundedBox args={[0.4, 0.05, 0.3]} radius={0.02} position={[0, 0.8, 0]} castShadow>
          <meshStandardMaterial color="#e2e8f0" roughness={0.2} />
        </RoundedBox>
        <mesh position={[0, 0.9, -0.12]}>
          <cylinderGeometry args={[0.015, 0.015, 0.15, 8]} />
          <meshStandardMaterial color={METAL} metalness={0.8} />
        </mesh>
      </group>
      {/* PWD symbol */}
      <mesh position={[0, 1.2, 1.26]}>
        <boxGeometry args={[0.3, 0.3, 0.02]} />
        <meshStandardMaterial color="#0ea5e9" />
      </mesh>
      <Text position={[0, 1.2, 1.28]} fontSize={0.3} color="#ffffff" fontWeight="bold">
        PWD
      </Text>
    </group>
  );
}

/* ─── HALLWAY ─── */
function Hallway() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0.5]} receiveShadow>
        <planeGeometry args={[18, 1.5]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.3} />
      </mesh>
      <Text position={[0, 0.05, 0.5]} fontSize={0.28} color="#94a3b8">
        ─── HALLWAY ───
      </Text>
    </group>
  );
}

/* ─── TECHNOLOGY DETAILS ─── */
function TechDetails() {
  return (
    <group>
      {/* CCTV cameras - ceiling mounted */}
      {[[-8, 2.35, -5], [8, 2.35, -5], [0, 2.35, -5], [-8, 2.35, 5], [8, 2.35, 5]].map(([x, y, z], i) => (
        <group key={i} position={[x, y, z]}>
          <mesh>
            <boxGeometry args={[0.12, 0.08, 0.12]} />
            <meshStandardMaterial color="#1e293b" />
          </mesh>
          <mesh position={[0, -0.06, 0]}>
            <cylinderGeometry args={[0.02, 0.02, 0.06, 8]} />
            <meshStandardMaterial color={METAL} metalness={0.6} />
          </mesh>
        </group>
      ))}
      {/* WiFi access points */}
      {[[-4, 2.38, -3], [4, 2.38, 3]].map(([x, y, z], i) => (
        <group key={i} position={[x, y, z]}>
          <mesh>
            <boxGeometry args={[0.2, 0.04, 0.2]} />
            <meshStandardMaterial color="#f8fafc" />
          </mesh>
          <Float speed={4} floatIntensity={0.05}>
            <mesh position={[0, -0.04, 0]}>
              <sphereGeometry args={[0.015, 8, 8]} />
              <meshStandardMaterial color={SCREEN_GREEN} emissive={SCREEN_GREEN} emissiveIntensity={1} />
            </mesh>
          </Float>
        </group>
      ))}
      {/* Network rack/server cabinet */}
      <group position={[8.5, 0, -6]}>
        <RoundedBox args={[0.5, 1.8, 0.4]} radius={0.02} position={[0, 0.9, 0]} castShadow receiveShadow>
          <meshStandardMaterial color="#1e293b" roughness={0.5} />
        </RoundedBox>
        {/* LED indicators */}
        {[0.3, 0.5, 0.7, 0.9, 1.1].map((y, i) => (
          <Float key={i} speed={2 + i} floatIntensity={0.02}>
            <mesh position={[0.26, y, 0.15]}>
              <sphereGeometry args={[0.012, 6, 6]} />
              <meshStandardMaterial color={i % 2 === 0 ? SCREEN_GREEN : SCREEN_BLUE} emissive={i % 2 === 0 ? SCREEN_GREEN : SCREEN_BLUE} emissiveIntensity={1} />
            </mesh>
          </Float>
        ))}
      </group>
      {/* Smart lighting indicator */}
      {[[-5, 2.36, 0], [5, 2.36, 0], [0, 2.36, -2]].map(([x, y, z], i) => (
        <mesh key={i} position={[x, y, z]}>
          <boxGeometry args={[0.3, 0.02, 0.3]} />
          <meshStandardMaterial color="#fef3c7" emissive="#fef3c7" emissiveIntensity={0.4} />
        </mesh>
      ))}
    </group>
  );
}

/* ─── INNER ROOM DIVIDERS ─── */
function RoomDividers() {
  const wallMat = { color: '#dde4ee', roughness: 0.6, metalness: 0.05 };
  return (
    <group>
      {/* Left partition wall (separates Staff/Sterilization/Storage from center) */}
      <mesh position={[-5, 1.0, 0]} rotation={[0, Math.PI / 2, 0]} castShadow>
        <boxGeometry args={[14, 2.0, 0.08]} />
        <meshStandardMaterial {...wallMat} />
      </mesh>
      {/* Right partition wall (separates Xray from center) */}
      <mesh position={[5, 1.0, 0]} rotation={[0, Math.PI / 2, 0]} castShadow>
        <boxGeometry args={[14, 2.0, 0.08]} />
        <meshStandardMaterial {...wallMat} />
      </mesh>
      {/* Treatment room area divider (back wall of treatment zone) */}
      <mesh position={[0, 1.0, 1.5]}>
        <boxGeometry args={[8, 2.0, 0.08]} />
        <meshStandardMaterial {...wallMat} />
      </mesh>
      {/* Consultation room back wall */}
      <mesh position={[0, 1.0, -1.8]}>
        <boxGeometry args={[6, 2.0, 0.08]} />
        <meshStandardMaterial {...wallMat} />
      </mesh>
    </group>
  );
}

/* ─── MAIN SCENE ─── */
export default function ClinicScene({ rooms, queue, selectedRoom, onSelectRoom }) {
  const roomPositions = useMemo(() => {
    const treatmentRooms = rooms.filter(r => r.number <= 2);
    return treatmentRooms.map((_, i) => [i * 5.5 - 2.75, 0, 3.5]);
  }, [rooms.length]);

  return (
    <Canvas
      shadows
      camera={{ position: [14, 18, 20], fov: 40 }}
      style={{ background: 'transparent' }}
      gl={{ antialias: true }}
    >
      <ambientLight intensity={0.5} color="#fef3c7" />
      <directionalLight
        position={[10, 18, 8]}
        intensity={1.3}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={50}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
      />
      <pointLight position={[-8, 5, -5]} intensity={0.3} color="#bfdbfe" />
      <pointLight position={[8, 5, 5]} intensity={0.3} color="#bfdbfe" />
      <pointLight position={[0, 3, 0]} intensity={0.2} color="#fef3c7" />
      <fog attach="fog" args={['#f0f5ff', 30, 55]} />

      <Floor />
      <Walls />
      <WalkInKiosk />
      <ReceptionDesk />
      <WaitingArea queue={queue} />
      <Hallway />
      <RoomDividers />
      <ConsultationRoom />
      <XrayRoom />
      <SterilizationRoom />
      <StorageRoom />
      <StaffRoom />
      <Restroom />
      <TechDetails />

      {rooms.slice(0, 2).map((room, i) => (
        <TreatmentRoom
          key={room.id}
          room={room}
          position={roomPositions[i] || [i * 5.5 - 2.75, 0, 3.5]}
          onClick={onSelectRoom}
          isSelected={selectedRoom?.id === room.id}
        />
      ))}

      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={10}
        maxDistance={40}
        maxPolarAngle={Math.PI / 2.2}
        target={[0, 0, 0]}
      />
    </Canvas>
  );
}
