import { Environment, Lightformer } from '@react-three/drei'
import { CEILING_LIGHTS, ROOM } from '../data/room'
import { useStore } from '../state/store'

/**
 * Evening: the two ceiling lamps, as in the reference photographs.
 * Day: sun and sky light entering through the two real windows; lamps off.
 */
export function Lighting() {
  const lighting = useStore((s) => s.lighting)
  const H = ROOM.ceiling
  return (
    <>
      <color attach="background" args={['#191817']} />
      {/* small local studio environment – only for soft reflections on glossy surfaces */}
      <Environment resolution={128} frames={1} environmentIntensity={lighting === 'day' ? 0.5 : 0.22}>
        <color attach="background" args={[lighting === 'day' ? '#9aa3ad' : '#5a5046']} />
        <Lightformer form="rect" intensity={lighting === 'day' ? 3 : 1.6} color={lighting === 'day' ? '#eef4ff' : '#ffe9c8'} position={[0, 4, 0]} rotation-x={Math.PI / 2} scale={[8, 4, 1]} />
        <Lightformer form="rect" intensity={lighting === 'day' ? 4 : 0.2} color="#dfeaff" position={[0, 1.5, 5]} scale={[7, 2, 1]} />
        <Lightformer form="rect" intensity={0.5} color="#ffe2b8" position={[0, 1.5, -5]} rotation-y={Math.PI} scale={[7, 3, 1]} />
      </Environment>

      {lighting === 'evening' ? (
        <>
          <hemisphereLight args={['#fff8ee', '#ddd0bd', 1.2]} />
          {CEILING_LIGHTS.map((l, i) => (
            <pointLight
              key={i}
              position={[l.x, H - 0.16, l.z]}
              intensity={5.2}
              color="#ffedd6"
              shadow-intensity={0.55}
              shadow-radius={4}
              decay={2}
              castShadow
              shadow-mapSize={[1024, 1024]}
              shadow-bias={-0.0006}
              shadow-normalBias={0.035}
              shadow-camera-near={0.08}
              shadow-camera-far={9}
            />
          ))}
        </>
      ) : (
        <>
          <hemisphereLight args={['#f6f8fb', '#cdbfa9', 1.5]} />
          <directionalLight
            position={[4.6, 4.6, 7.6]}
            target-position={[3.3, 0, 1.0]}
            intensity={5.5}
            color="#fff1dc"
            castShadow
            shadow-mapSize={[2048, 2048]}
            shadow-bias={-0.0004}
            shadow-normalBias={0.03}
            shadow-camera-left={-5.5}
            shadow-camera-right={5.5}
            shadow-camera-top={4}
            shadow-camera-bottom={-4}
            shadow-camera-near={0.5}
            shadow-camera-far={22}
          />
          <pointLight position={[1.9, 1.5, 2.2]} intensity={3.2} color="#e4eeff" decay={2} />
          <pointLight position={[4.7, 1.5, 1.7]} intensity={2.6} color="#e4eeff" decay={2} />
        </>
      )}
    </>
  )
}
