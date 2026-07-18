import { useRef, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Text, RoundedBox, Float } from '@react-three/drei';

const STATUS_COLORS = {
  AVAILABLE: '#10b981',
  OCCUPIED: '#ef4444',
  CLEANING: '#3b82f6',
  MAINTENANCE: '#f59e0b',
};

function Floor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
      <planeGeometry args={[20, 14]} />
      <meshStandardMaterial color="#f0f9ff" />
    </mesh>
  );
}

function Walls() {
  const wallMat = { color: '#e0e7ff', transparent: true, opacity: 0.3 };
  return (
    <group>
      <mesh position={[0, 1, -7]} castShadow>
        <boxGeometry args={[20, 2, 0.1]} />
        <meshStandardMaterial {...wallMat} />
      </mesh>
      <mesh position={[0, 1, 7]} castShadow>
        <boxGeometry args={[20, 2, 0.1]} />
        <meshStandardMaterial {...wallMat} />
      </mesh>
      <mesh position={[-10, 1, 0]} rotation={[0, Math.PI / 2, 0]} castShadow>
        <boxGeometry args={[14, 2, 0.1]} />
        <meshStandardMaterial {...wallMat} />
      </mesh>
      <mesh position={[10, 1, 0]} rotation={[0, Math.PI / 2, 0]} castShadow>
        <boxGeometry args={[14, 2, 0.1]} />
        <meshStandardMaterial {...wallMat} />
      </mesh>
    </group>
  );
}

function ReceptionDesk() {
  return (
    <group position={[0, 0, -5.5]}>
      <RoundedBox args={[6, 1, 1.5]} radius={0.1} position={[0, 0.5, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#0ea5e9" />
      </RoundedBox>
      <Text position={[0, 1.3, 0]} fontSize={0.35} color="#0369a1" fontWeight="bold">
        RECEPTION
      </Text>
      <Float speed={2} floatIntensity={0.3}>
        <mesh position={[-2, 1.2, 0]}>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshStandardMaterial color="#10b981" emissive="#10b981" emissiveIntensity={0.8} />
        </mesh>
        <mesh position={[-1.7, 1.2, 0]}>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshStandardMaterial color="#10b981" emissive="#10b981" emissiveIntensity={0.8} />
        </mesh>
      </Float>
    </group>
  );
}

function WaitingArea({ queue }) {
  const seats = [
    [-3, -3.2], [-1.5, -3.2], [0, -3.2], [1.5, -3.2], [3, -3.2],
    [-3, -4.2], [-1.5, -4.2], [0, -4.2], [1.5, -4.2], [3, -4.2],
  ];

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, -3.7]} receiveShadow>
        <planeGeometry args={[9, 3]} />
        <meshStandardMaterial color="#fef3c7" />
      </mesh>
      <Text position={[0, 0.15, -2.5]} fontSize={0.3} color="#92400e" fontWeight="bold">
        WAITING AREA ({queue.filter(q => q.status === 'WAITING').length} patients)
      </Text>
      {seats.map(([x, z], i) => {
        const occupied = i < queue.filter(q => q.status === 'WAITING').length;
        return (
          <group key={i} position={[x, 0, z]}>
            <RoundedBox args={[0.8, 0.4, 0.8]} radius={0.05} position={[0, 0.2, 0]} castShadow receiveShadow>
              <meshStandardMaterial color={occupied ? '#fbbf24' : '#d1d5db'} />
            </RoundedBox>
            {occupied && (
              <Float speed={1.5} floatIntensity={0.15}>
                <mesh position={[0, 0.65, 0]}>
                  <sphereGeometry args={[0.15, 16, 16]} />
                  <meshStandardMaterial color="#f59e0b" />
                </mesh>
              </Float>
            )}
          </group>
        );
      })}
    </group>
  );
}

function DentalRoom({ room, position, onClick, isSelected }) {
  const color = STATUS_COLORS[room.status] || '#94a3b8';
  const appointment = room.appointments?.[0];

  return (
    <group position={position}>
      <RoundedBox
        args={[3, 1.5, 2.5]}
        radius={0.1}
        position={[0, 0.75, 0]}
        castShadow
        receiveShadow
        onClick={(e) => { e.stopPropagation(); onClick(room); }}
        onPointerOver={(e) => { document.body.style.cursor = 'pointer'; }}
        onPointerOut={(e) => { document.body.style.cursor = 'default'; }}
      >
        <meshStandardMaterial
          color={isSelected ? '#1a5fb4' : color}
          emissive={isSelected ? '#1a5fb4' : color}
          emissiveIntensity={isSelected ? 0.4 : 0.15}
          transparent
          opacity={0.85}
        />
      </RoundedBox>

      <Text position={[0, 1.65, 0]} fontSize={0.25} color="#1e293b" fontWeight="bold">
        Room {room.number}
      </Text>
      <Text position={[0, 1.35, 0]} fontSize={0.15} color="#475569">
        {room.name}
      </Text>

      <mesh position={[0, 0.75, 1.26]}>
        <planeGeometry args={[2, 1]} />
        <meshStandardMaterial color="#1e293b" transparent opacity={0.3} />
      </mesh>

      {room.status === 'OCCUPIED' && (
        <group>
          <Float speed={3} floatIntensity={0.1}>
            <mesh position={[-0.5, 0.5, 0]}>
              <cylinderGeometry args={[0.05, 0.05, 0.3, 8]} />
              <meshStandardMaterial color="#94a3b8" metalness={0.8} />
            </mesh>
          </Float>
          {appointment && (
            <Text position={[0, 0.3, 0]} fontSize={0.12} color="#ffffff" maxWidth={2.5} textAlign="center">
              {`${appointment.patient?.user?.name || 'Patient'}\n${appointment.dentist?.name || 'Dentist'}\n${appointment.reason || ''}`}
            </Text>
          )}
        </group>
      )}

      {room.status === 'CLEANING' && (
        <Float speed={4} floatIntensity={0.2}>
          <mesh position={[0, 1.2, 0]}>
            <octahedronGeometry args={[0.12]} />
            <meshStandardMaterial color="#3b82f6" emissive="#3b82f6" emissiveIntensity={0.5} />
          </mesh>
        </Float>
      )}

      {room.status === 'MAINTENANCE' && (
        <Float speed={2} floatIntensity={0.15}>
          <mesh position={[0, 1.2, 0]}>
            <octahedronGeometry args={[0.12]} />
            <meshStandardMaterial color="#f59e0b" emissive="#f59e0b" emissiveIntensity={0.5} />
          </mesh>
        </Float>
      )}

      {room.status === 'AVAILABLE' && (
        <Float speed={1.5} floatIntensity={0.1}>
          <mesh position={[0, 1.2, 0]}>
            <octahedronGeometry args={[0.12]} />
            <meshStandardMaterial color="#10b981" emissive="#10b981" emissiveIntensity={0.5} />
          </mesh>
        </Float>
      )}
    </group>
  );
}

function Hallway() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0.5]} receiveShadow>
        <planeGeometry args={[18, 2]} />
        <meshStandardMaterial color="#e2e8f0" />
      </mesh>
      <Text position={[0, 0.1, 0.5]} fontSize={0.2} color="#94a3b8">
        ——— HALLWAY ———
      </Text>
    </group>
  );
}

export default function ClinicScene({ rooms, queue, selectedRoom, onSelectRoom }) {
  const roomPositions = useMemo(() => {
    const cols = Math.min(rooms.length, 3);
    return rooms.map((_, i) => {
      const row = Math.floor(i / cols);
      const col = i % cols;
      const x = (col - (cols - 1) / 2) * 4;
      const z = 3.5 + row * 3;
      return [x, 0, z];
    });
  }, [rooms.length]);

  return (
    <Canvas
      shadows
      camera={{ position: [0, 12, 16], fov: 50 }}
      style={{ background: 'transparent' }}
      gl={{ antialias: true }}
    >
      <ambientLight intensity={0.6} />
      <directionalLight
        position={[8, 15, 5]}
        intensity={1.2}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={50}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={15}
        shadow-camera-bottom={-15}
      />
      <pointLight position={[-8, 5, -5]} intensity={0.4} color="#bfdbfe" />
      <pointLight position={[8, 5, 5]} intensity={0.4} color="#bfdbfe" />

      <fog attach="fog" args={['#f0f9ff', 25, 50]} />

      <Floor />
      <Walls />
      <ReceptionDesk />
      <WaitingArea queue={queue} />
      <Hallway />

      {rooms.map((room, i) => (
        <DentalRoom
          key={room.id}
          room={room}
          position={roomPositions[i] || [i * 4 - 6, 0, 3.5]}
          onClick={onSelectRoom}
          isSelected={selectedRoom?.id === room.id}
        />
      ))}

      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={8}
        maxDistance={30}
        maxPolarAngle={Math.PI / 2.2}
        target={[0, 0, 1]}
      />
    </Canvas>
  );
}
