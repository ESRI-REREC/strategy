import { useEffect, useRef } from 'react';
import type MapView from '@arcgis/core/views/MapView';

interface Props {
  onLocationSelect: (lng: number, lat: number) => void;
  hasLocation: boolean;
}

export default function FacilityMap({ onLocationSelect, hasLocation }: Props) {
  const mapDivRef = useRef<HTMLDivElement>(null);
  const onSelectRef = useRef(onLocationSelect);

  useEffect(() => {
    onSelectRef.current = onLocationSelect;
  }, [onLocationSelect]);

  useEffect(() => {
    if (!mapDivRef.current) return;

    let view: MapView | null = null;
    let cleanedUp = false;

    async function initMap() {
      const [
        { default: esriConfig },
        { default: Map },
        { default: MapView },
        { default: Search },
        { default: GraphicsLayer },
        { default: Graphic },
        { default: SimpleMarkerSymbol },
        { default: Point },
      ] = await Promise.all([
        import('@arcgis/core/config'),
        import('@arcgis/core/Map'),
        import('@arcgis/core/views/MapView'),
        import('@arcgis/core/widgets/Search'),
        import('@arcgis/core/layers/GraphicsLayer'),
        import('@arcgis/core/Graphic'),
        import('@arcgis/core/symbols/SimpleMarkerSymbol'),
        import('@arcgis/core/geometry/Point'),
      ]);

      if (cleanedUp) return;

      esriConfig.assetsPath = 'https://js.arcgis.com/4.30/@arcgis/core/assets';

      const graphicsLayer = new GraphicsLayer();

      const map = new Map({
        basemap: 'hybrid',
        layers: [graphicsLayer],
      });

      view = new MapView({
        container: mapDivRef.current!,
        map,
        center: [38, 0],
        zoom: 6,
      });

      const markerSymbol = new SimpleMarkerSymbol({
        color: [253, 126, 20],
        size: 14,
        outline: {
          color: [255, 255, 255],
          width: 2,
        },
      });

      function placeMarker(longitude: number, latitude: number) {
        graphicsLayer.removeAll();
        const point = new Point({ longitude, latitude });
        const graphic = new Graphic({ geometry: point, symbol: markerSymbol });
        graphicsLayer.add(graphic);
        onSelectRef.current(longitude, latitude);
      }

      view.on('click', (event: any) => {
        const { longitude, latitude } = event.mapPoint;
        placeMarker(longitude, latitude);
      });

      const search = new Search({
        view,
        popupEnabled: false,
      });

      view.ui.add(search, 'top-right');

      search.on('select-result', (event: any) => {
        const result = event.result;
        if (result?.feature?.geometry) {
          const geom = result.feature.geometry;
          placeMarker(geom.longitude, geom.latitude);
          view!.goTo({ center: [geom.longitude, geom.latitude], zoom: 14 });
        }
      });
    }

    initMap().catch(console.error);

    return () => {
      cleanedUp = true;
      if (view) {
        view.destroy();
        view = null;
      }
    };
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div ref={mapDivRef} style={{ width: '100%', height: '100%' }} />
      {!hasLocation && (
        <div
          style={{
            position: 'absolute',
            bottom: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            color: '#fff',
            padding: '6px 14px',
            borderRadius: 9999,
            fontSize: 13,
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
            zIndex: 10,
          }}
        >
          Click on the map to place a pin
        </div>
      )}
    </div>
  );
}
