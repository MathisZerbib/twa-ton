import React, { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import styled from "styled-components";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

const MapWrapper = styled.div`
  height: 80vh;
  width: 100%;
  margin: 0 auto;
  position: relative;
`;

interface MapDeliveryProps {
  onLocationSelect: (location: { lat: number; lng: number }) => void;
  startPoint?: { lat: number; lng: number }; // Optional start point
  endPoint?: { lat: number; lng: number }; // Optional end point
}

const MapDelivery: React.FC<MapDeliveryProps> = ({
  onLocationSelect,
  startPoint,
  endPoint,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const startMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const endMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const carMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    let map: mapboxgl.Map;

    if (!mapRef.current) return;

    const createMarkerElement = (svgPath: string): HTMLDivElement => {
      const div = document.createElement("div");
      div.style.width = "30px";
      div.style.height = "30px";
      div.innerHTML = `<img src="${svgPath}" alt="marker" style="width:100%;height:100%;" />`;
      return div;
    };

    const initMap = async () => {
      map = new mapboxgl.Map({
        container: mapRef.current!,
        style: "mapbox://styles/mapbox/streets-v11",
        center: [startPoint?.lng ?? -122.414, startPoint?.lat ?? 37.776],
        zoom: 12,
      });

      if (startPoint) {
        addNativeMarker(
          [startPoint.lng, startPoint.lat],
          map,
          "A",
          startMarkerRef
        );
      }
      if (endPoint) {
        addNativeMarker([endPoint.lng, endPoint.lat], map, "B", endMarkerRef);
      }

      if (startPoint && endPoint) {
        const start = [startPoint.lng, startPoint.lat];
        const end = [endPoint.lng, endPoint.lat];
        const route = await fetchRoute(
          start as [number, number],
          end as [number, number]
        );

        map.on("load", () => {
          map.addSource("route", {
            type: "geojson",
            data: {
              type: "Feature",
              properties: {},
              geometry: route,
            },
          });

          map.addLayer({
            id: "route",
            type: "line",
            source: "route",
            layout: {
              "line-join": "round",
              "line-cap": "round",
            },
            paint: {
              "line-color": "#3887be",
              "line-width": 5,
            },
          });

          const carMarkerElement = createMarkerElement("car.svg");
          carMarkerRef.current = new mapboxgl.Marker({
            element: carMarkerElement,
          })
            .setLngLat(start as [number, number]) // Convert start to [number, number]
            .addTo(map);

          animateCar(route.coordinates, carMarkerRef.current!);
        });
      }

      map.on("click", async (e) => {
        const coordinates = e.lngLat;
        onLocationSelect({
          lat: coordinates.lat,
          lng: coordinates.lng,
        });

        addNativeMarker(
          [coordinates.lng, coordinates.lat],
          map,
          "B",
          endMarkerRef
        );

        if (startPoint) {
          const start: [number, number] = [startPoint.lng, startPoint.lat];
          const end: [number, number] = [coordinates.lng, coordinates.lat];
          const route = await fetchRoute(start, end);

          const routeSource = map.getSource("route") as mapboxgl.GeoJSONSource;
          routeSource.setData({
            type: "Feature",
            properties: {},
            geometry: route,
          });

          if (carMarkerRef.current) {
            carMarkerRef.current.setLngLat(start);
            animateCar(route.coordinates, carMarkerRef.current);
          }
        }
      });
    };

    initMap();

    return () => {
      if (map) map.remove();
      if (animationFrameRef.current)
        cancelAnimationFrame(animationFrameRef.current);
    };
  }, [startPoint, endPoint]);

  const fetchRoute = async (start: [number, number], end: [number, number]) => {
    const response = await fetch(
      `https://api.mapbox.com/directions/v5/mapbox/driving/${start[0]},${start[1]};${end[0]},${end[1]}?geometries=geojson&access_token=${mapboxgl.accessToken}`
    );
    const data = await response.json();
    return data.routes[0].geometry;
  };

  const addNativeMarker = (
    lngLat: [number, number],
    map: mapboxgl.Map,
    label: string,
    markerRef: React.MutableRefObject<mapboxgl.Marker | null>
  ) => {
    const el = document.createElement("div");
    el.className = "marker";
    el.textContent = label;
    el.style.backgroundColor = "red";
    el.style.color = "white";
    el.style.fontSize = "16px";
    el.style.padding = "4px";
    el.style.borderRadius = "50%";
    el.style.textAlign = "center";
    el.style.width = "30px";
    el.style.height = "30px";
    el.style.display = "flex";
    el.style.alignItems = "center";
    el.style.justifyContent = "center";

    if (markerRef.current) {
      markerRef.current.setLngLat(lngLat).addTo(map);
    } else {
      markerRef.current = new mapboxgl.Marker({ element: el })
        .setLngLat(lngLat)
        .addTo(map);
    }
  };

  const animateCar = (
    route: [number, number][],
    marker: mapboxgl.Marker,
    index = 0
  ) => {
    if (index < route.length) {
      marker.setLngLat(route[index]);
      /// animate slowly on the road smoothly
      animationFrameRef.current = requestAnimationFrame(() => {
        animateCar(route, marker, index + 1);
      });
    }
  };

  return <MapWrapper ref={mapRef} />;
};

export default MapDelivery;
