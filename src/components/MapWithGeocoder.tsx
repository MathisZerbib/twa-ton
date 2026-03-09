import React, { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import MapboxGeocoder from "@mapbox/mapbox-gl-geocoder";
import "mapbox-gl/dist/mapbox-gl.css";
import "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN as string;

interface MapWithGeocoderProps {
  onSelectedAddress: (address: string, lat?: number, lng?: number) => void;
}

const MapWithGeocoder: React.FC<MapWithGeocoderProps> = ({
  onSelectedAddress,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<mapboxgl.Map | null>(null);
  const [address, setAddress] = React.useState("");

  // Keep latest callback in a ref to avoid re-run of effect
  const callbackRef = useRef(onSelectedAddress);
  useEffect(() => {
    callbackRef.current = onSelectedAddress;
  }, [onSelectedAddress]);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const FALLBACK_CENTER: [number, number] = [3.8767, 43.6116];

    const initMap = (center: [number, number]) => {
      if (mapInstance.current) return;

      const map = new mapboxgl.Map({
        container: mapRef.current!,
        style: "mapbox://styles/mapbox/streets-v12",
        center,
        zoom: 14,
      });

      mapInstance.current = map;

      const geocoder = new MapboxGeocoder({
        accessToken: mapboxgl.accessToken!,
        mapboxgl: mapboxgl as any,
        marker: false,
        placeholder: "Chercher une adresse",
        language: "fr",
        addressAccuracy: "street",
        types: "address,poi",
        limit: 5,
      });

      const geocoderContainer = document.createElement("div");
      geocoderContainer.className = "geocoder-container";

      const geocoderIcon = geocoder.onAdd(map);
      geocoderContainer.appendChild(geocoderIcon);
      map.getContainer().appendChild(geocoderContainer);

      map.addControl(
        new mapboxgl.GeolocateControl({
          positionOptions: { enableHighAccuracy: true },
          trackUserLocation: true,
          showUserHeading: true,
        }),
        "bottom-right"
      );

      const marker = new mapboxgl.Marker({
        draggable: true,
        color: "#FF6B35", // Changed to match theme
      })
        .setLngLat(center)
        .addTo(map);

      const fetchAddress = (lngLat: mapboxgl.LngLat) => {
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lngLat.lng},${lngLat.lat}.json?access_token=${mapboxgl.accessToken}`;
        fetch(url)
          .then((response) => response.json())
          .then((data) => {
            if (data.features && data.features.length > 0) {
              const place = data.features[0].place_name;
              setAddress(place);
              callbackRef.current(place, lngLat.lat, lngLat.lng);
            }
          })
          .catch((error) => console.error("Error fetching address:", error));
      };

      const addCircle = (lngLat: mapboxgl.LngLat) => {
        const radiusInMeters = 1000;
        const source = map.getSource("circle") as mapboxgl.GeoJSONSource;

        if (source) {
          source.setData({
            type: "Feature",
            geometry: { type: "Point", coordinates: [lngLat.lng, lngLat.lat] },
            properties: {},
          });
        } else {
          map.addLayer({
            id: "circle",
            type: "circle",
            source: {
              type: "geojson",
              data: {
                type: "Feature",
                geometry: { type: "Point", coordinates: [lngLat.lng, lngLat.lat] },
                properties: {},
              },
            },
            paint: {
              "circle-radius": {
                stops: [[0, 0], [20, radiusInMeters / 3]],
                base: 2,
              },
              "circle-color": "#FF6B35", // Theme color
              "circle-opacity": 0.15,
              "circle-stroke-width": 2,
              "circle-stroke-color": "#FF6B35",
            },
          });
        }
      };

      marker.on("dragend", () => {
        const lngLat = marker.getLngLat();
        fetchAddress(lngLat);
        addCircle(lngLat);
      });

      geocoder.on("result", (event) => {
        const lngLat = event.result.geometry.coordinates as [number, number];
        const point = { lng: lngLat[0], lat: lngLat[1] } as mapboxgl.LngLat;
        marker.setLngLat(point);
        map.flyTo({ center: point });
        setAddress(event.result.place_name);
        callbackRef.current(event.result.place_name, point.lat, point.lng);
        addCircle(point);
      });

      map.on("click", (event: mapboxgl.MapMouseEvent) => {
        const lngLat = event.lngLat;
        marker.setLngLat(lngLat);
        fetchAddress(lngLat);
        addCircle(lngLat);
      });

      map.on("load", () => {
        map.resize();
        addCircle(map.getCenter());
      });

      // Resize when container becomes visible (e.g. inside a drawer)
      const ro = new ResizeObserver(() => {
        map.resize();
      });
      ro.observe(mapRef.current!);
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => initMap([pos.coords.longitude, pos.coords.latitude]),
        () => initMap(FALLBACK_CENTER),
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      initMap(FALLBACK_CENTER);
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []); // Run only once

  return (
    <>
      <div ref={mapRef} style={{ width: "100%", height: "90vh" }}></div>
      <style>
        {`
          .geocoder-container {
            position: absolute;
            top: 10px;
            left: 50%;
            transform: translateX(-50%);
            width: 80%;
            z-index: 1;
          }
          .mapboxgl-ctrl-geocoder {
            min-width: 100%;
          }
        `}
      </style>
    </>
  );
};

export default MapWithGeocoder;
