import React, { Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useTexture } from '@react-three/drei';

// TODO : Centrer la Terre
// TODO : Vérifier que les marqueurs sont bien positionnés
// TODO : Pouvoir cliquer sur les marqueurs pour afficher des informations
function latLonToCartesian(lat, lon, radius = 1.012) {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);

    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.cos(phi);
    const z = radius * Math.sin(phi) * Math.sin(theta);

    return [x, y, z];
}

function EarthWithMarkers({ locations }) {
    const groupRef = useRef();
    const earthRef = useRef();
    const cloudsRef = useRef();

    const [colorMap, cloudMap] = useTexture([
        '/textures/2k_earth_daymap.jpg',
        '/textures/8k_earth_clouds.jpg',
    ]);

    // 🌍 Rotation automatique du globe
    useFrame(() => {
        if (groupRef.current) {
            groupRef.current.rotation.y += 0.001;
        }
    });

    return (
        <group ref={groupRef}>
            {/* 🌍 Terre */}
            <mesh ref={earthRef}>
                <sphereGeometry args={[1, 64, 64]} />
                <meshStandardMaterial map={colorMap} />
            </mesh>

            {/* ☁️ Nuages */}
            <mesh ref={cloudsRef}>
                <sphereGeometry args={[1.01, 64, 64]} />
                <meshStandardMaterial
                    map={cloudMap}
                    transparent
                    opacity={0.3}
                    depthWrite={false}
                />
            </mesh>

            {/* 📍 Marqueurs */}
            {locations.map((loc) => {
                const [x, y, z] = latLonToCartesian(loc.latitude, loc.longitude, 1.012);
                return (
                    <mesh key={loc.id} position={[x, y, z]}>
                        <sphereGeometry args={[0.015, 16, 16]} />
                        <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={1} />
                    </mesh>
                );
            })}
        </group>
    );
}

export default function JourneyGlobe({ locations }) {
    return (
        <div
            style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
            }}
        >
            <div
                style={{
                    width: '85%',
                    aspectRatio: '1 / 1',
                    borderRadius: '1rem',
                    overflow: 'hidden',
                    backgroundColor: '#f3f4f6',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                }}
            >
                <div style={{ width: '100%', height: '100%' }}>
                    <Canvas camera={{ position: [0, 0.3, 3.5], fov: 45 }}>
                        <ambientLight intensity={0.5} />
                        <directionalLight position={[5, 3, 5]} intensity={1.5} />
                        <Suspense fallback={null}>
                            <EarthWithMarkers locations={locations} />
                        </Suspense>
                        <OrbitControls
                            enableZoom={false}
                            enablePan={false}
                            autoRotate={false}
                            minPolarAngle={Math.PI / 3}
                            maxPolarAngle={Math.PI / 1.8}
                        />
                    </Canvas>
                </div>
            </div>
        </div>
    );
}
