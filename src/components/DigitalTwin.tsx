'use client';

import {
    Cartesian3,
    Cesium3DTileset as Cesium3DTilesetType,
    Cesium3DTileStyle,
    Viewer as CesiumViewer,
    CircleEmitter,
    Color,
    createWorldTerrainAsync,
    Ion,
    IonResource,
    Material,
    ParticleSystem,
    PolylineCollection,
    Transforms
} from 'cesium';
import { useEffect, useRef, useState } from 'react';
import { Cesium3DTileset, CesiumComponentRef, Viewer } from 'resium';

export default function DigitalTwin() {
  const viewerRef = useRef<CesiumComponentRef<CesiumViewer>>(null);
  const [tileset, setTileset] = useState<Cesium3DTilesetType | null>(null);
  const [terrainProvider, setTerrainProvider] = useState<any>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    (window as any).CESIUM_BASE_URL = '/cesium';
    const token = process.env.NEXT_PUBLIC_CESIUM_ION_TOKEN;
    if (!token) {
      console.error('Cesium Token missing!');
      return;
    }
    Ion.defaultAccessToken = token;
    setIsReady(true);

    createWorldTerrainAsync().then(setTerrainProvider);
  }, []);

  // --- Particle system wind ---
  useEffect(() => {
    const viewer = viewerRef.current?.cesiumElement;
    if (!tileset || !viewer || !viewer.scene) return;

    const windSystem = new ParticleSystem({
      image: '/wind_particle.png',
      startColor: Color.CYAN.withAlpha(0.7),
      endColor: Color.CYAN.withAlpha(0.0),
      startScale: 0.5,
      endScale: 0.1,
      minimumSpeed: 10.0,
      maximumSpeed: 20.0,
      lifetime: 6.0,
      emissionRate: 80,
      emitter: new CircleEmitter(300),
      modelMatrix: Transforms.eastNorthUpToFixedFrame(
        Cartesian3.fromDegrees(-66.9, 10.5, 50)
      ),
      updateCallback: (particle: any, dt: number) => {
        if (!tileset || tileset.isDestroyed()) return;

        const rootTile = tileset.root;
        if (!rootTile || !rootTile.children) return;

        rootTile.children.forEach((childTile: any) => {
          const box = childTile.boundingVolume?.boundingBox;
          if (!box) return;

          const pos = particle.position;
          const dist = Cartesian3.distance(pos, box.center);

          if (dist < 80) {
            // Deflect particle away from building
            const away = Cartesian3.subtract(pos, box.center, new Cartesian3());
            Cartesian3.normalize(away, away);
            particle.velocity = Cartesian3.multiplyByScalar(away, 15.0, new Cartesian3());
            particle.color = Color.CYAN.withAlpha(0.5);
          }
        });

        if (particle.velocity) {
          const direction = Cartesian3.normalize(particle.velocity, new Cartesian3());
          const angle = Math.atan2(direction.y, direction.x);
          particle.rotation = angle;
        }
      }
    });

    viewer.scene.primitives.add(windSystem);

    return () => {
      viewer.scene.primitives.remove(windSystem);
    };
  }, [tileset]);

  // --- Curved dynamic wind lines ---
  useEffect(() => {
    const viewer = viewerRef.current?.cesiumElement;
    if (!tileset || !viewer || !viewer.scene) return;

    const windCount = 120;
    const windLength = 0.005; // degrees
    const polylines = new PolylineCollection();
    viewer.scene.primitives.add(polylines);

    const windLines: any[] = [];

    for (let i = 0; i < windCount; i++) {
      const lon = -66.9 + Math.random() * 0.1;
      const lat = 10.5 + Math.random() * 0.1;
      const height = 50 + Math.random() * 50;

      const start = Cartesian3.fromDegrees(lon, lat, height);
      const end = Cartesian3.fromDegrees(lon + windLength, lat, height);

      const polyline = polylines.add({
        positions: [start, end],
        width: 2,
        material: Material.fromType('Color', { color: Color.CYAN.withAlpha(0.7) }),
        followSurface: false,
      });

      windLines.push({
        polyline,
        lon,
        lat,
        height,
        phaseY: Math.random() * Math.PI * 2,
        phaseZ: Math.random() * Math.PI * 2,
        speed: 0.00005 + Math.random() * 0.00005,
      });
    }

    const updateCallback = viewer.scene.preUpdate.addEventListener(() => {
      const time = Date.now() * 0.001;
      windLines.forEach(wl => {
        wl.lon += wl.speed;

        let curvedLat = wl.lat + Math.sin(time + wl.phaseY) * 0.0005;
        let curvedHeight = wl.height + Math.cos(time + wl.phaseZ) * 5;

        const start = Cartesian3.fromDegrees(wl.lon, curvedLat, curvedHeight);
        const end = Cartesian3.fromDegrees(wl.lon + windLength, curvedLat, curvedHeight);

        // Avoid buildings
        const rootTile = tileset.root;
        if (rootTile && rootTile.children) {
          rootTile.children.forEach((childTile: any) => {
            const box = childTile.boundingVolume?.boundingBox;
            if (!box) return;

            if (Cartesian3.distance(start, box.center) < 60) {
              curvedLat += 0.0005; // push north
              curvedHeight += 10;  // lift upward
            }
          });
        }

        wl.polyline.positions = [
          Cartesian3.fromDegrees(wl.lon, curvedLat, curvedHeight),
          Cartesian3.fromDegrees(wl.lon + windLength, curvedLat, curvedHeight)
        ];
      });
    });

    return () => {
      updateCallback();
      viewer.scene.primitives.remove(polylines);
    };
  }, [tileset]);

  if (!isReady || !terrainProvider) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-black text-cyan-500 font-mono">
        Authenticating Cesium Engine...
      </div>
    );
  }

  const flyToTileset = () => {
    const viewer = viewerRef.current?.cesiumElement;
    if (viewer && tileset && !tileset.isDestroyed()) {
      viewer.flyTo(tileset);
    }
  };

  return (
    <div className="h-screen w-full overflow-hidden bg-black relative">
      <button
        onClick={flyToTileset}
        className="absolute top-6 right-6 z-20 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs rounded shadow-lg"
      >
        Go to Tileset
      </button>

      <Viewer
        ref={viewerRef}
        full
        timeline={false}
        animation={false}
        baseLayerPicker={false}
        terrainProvider={terrainProvider}
        useDefaultRenderLoop={true}
        className="w-full h-full"
        contextOptions={{ webgl: { preserveDrawingBuffer: true } }}
      >
        <Cesium3DTileset
          url={IonResource.fromAssetId(1415196)}
          style={new Cesium3DTileStyle({ color: "color('white')" })}
          onReady={(tilesetObj: Cesium3DTilesetType) => {
            if (tilesetObj.isDestroyed()) return;
            setTileset(tilesetObj);

            tilesetObj.tileVisible.addEventListener((tile: any) => {
              const content = tile.content;
              if (!content || content.featuresLength === 0) return;
              for (let i = 0; i < content.featuresLength; i++) {
                const feature = content.getFeature(i);
                const height = feature.getProperty('height');
                if (typeof height === 'number') {
                  if (height >= 100) feature.color = Color.PURPLE.withAlpha(0.5);
                  else if (height >= 50) feature.color = Color.RED;
                  else feature.color = Color.WHITE;
                } else {
                  feature.color = Color.WHITE;
                }
              }
            });
          }}
        />
      </Viewer>
    </div>
  );
}
