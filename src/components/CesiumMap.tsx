// 2. Set Token (Keep this outside the component)
// Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI3YzJjZjRlYy1kMzFkLTRkNGMtYTcxOC0xYWI0ZGRkOTBkZmMiLCJpZCI6MzkwMzk5LCJpYXQiOjE3NzEwMDY4NzB9.Hv_fSvDkedIlW4nGWhwAovoLjFA6Nx5TrDNWkjQDI-o';

'use client';

import {
    Viewer as CesiumViewer,
    Ion,
    IonResource
} from 'cesium';
import { useRef } from 'react';
import {
    Cesium3DTileset,
    CesiumComponentRef,
    Viewer
} from 'resium';

// ✅ IMPORTANT: Set worker base path BEFORE Cesium initializes
if (typeof window !== 'undefined') {
  (window as any).CESIUM_BASE_URL = '/cesium';
}

// ✅ Set your Ion token
Ion.defaultAccessToken =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI3YzJjZjRlYy1kMzFkLTRkNGMtYTcxOC0xYWI0ZGRkOTBkZmMiLCJpZCI6MzkwMzk5LCJpYXQiOjE3NzEwMDY4NzB9.Hv_fSvDkedIlW4nGWhwAovoLjFA6Nx5TrDNWkjQDI-o'; // Replace for production

export default function CesiumMap() {
  const viewerRef =
    useRef<CesiumComponentRef<CesiumViewer>>(null);

  // ✅ Use a real asset ID
  const MY_ASSET_ID = 96188; // Public NYC sample

  return (
    <div style={{ height: '100vh', width: '100%' }}>
      <Viewer
        ref={viewerRef}
        timeline={false}
        animation={false}
        baseLayerPicker={false}
        homeButton={false}
        navigationHelpButton={false}
        sceneModePicker={false}
      >
        <Cesium3DTileset
          url={IonResource.fromAssetId(MY_ASSET_ID)}
          onReady={() => {
            console.log('3D Digital Twin Loaded!');
          }}
        />
      </Viewer>
    </div>
  );
}
