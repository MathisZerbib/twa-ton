import React, { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import MapboxGeocoder from "@mapbox/mapbox-gl-geocoder";
import "mapbox-gl/dist/mapbox-gl.css";
import "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

interface MapWithGeocoderProps {
  onSelectedAddress: (address: string) => void;
}

const MapWithGeocoder: React.FC<MapWithGeocoderProps> = ({
  onSelectedAddress,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [address, setAddress] = React.useState("");

  useEffect(() => {
    if (!mapRef.current) return;

    const map = new mapboxgl.Map({
      container: mapRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [3.8767, 43.6116],
      zoom: 12,
    });

    const geocoder = new MapboxGeocoder({
      accessToken: mapboxgl.accessToken,
      mapboxgl: mapboxgl,
      marker: false,
      placeholder: "Chercher une adresse",
      countries: "fr",
      language: "fr",
      addressAccuracy: "street",
      types: "address,poi",
      limit: 5,
    });

    const geocoderContainer = document.createElement("div");
    geocoderContainer.className = "geocoder-container";
    geocoderContainer.appendChild(geocoder.onAdd(map));

    map.getContainer().appendChild(geocoderContainer);

    map.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true,
        },
        trackUserLocation: true,
        showUserHeading: true,
      }),
      "bottom-right"
    );

    const marker = new mapboxgl.Marker({
      draggable: true,
      color: "#00BF0A",
    })
      .setLngLat(map.getCenter())
      .addTo(map);

    const fetchAddress = (lngLat: mapboxgl.LngLat) => {
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lngLat.lng},${lngLat.lat}.json?access_token=${mapboxgl.accessToken}`;
      fetch(url)
        .then((response) => response.json())
        .then((data) => {
          if (data.features && data.features.length > 0) {
            const place = data.features[0].place_name;
            setAddress(place);
            onSelectedAddress(place);
          }
        })
        .catch((error) => console.error("Error fetching address:", error));
    };

    const addCircle = (lngLat: mapboxgl.LngLat) => {
      const radiusInMeters = 1000;

      const circleSource = map.getSource("circle") as mapboxgl.GeoJSONSource;
      circleSource?.setData({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [lngLat.lng, lngLat.lat],
        },
        properties: {},
      });

      if (!map.getLayer("circle")) {
        map.addLayer({
          id: "circle",
          type: "circle",
          source: {
            type: "geojson",
            data: {
              type: "Feature",
              geometry: {
                type: "Point",
                coordinates: [lngLat.lng, lngLat.lat],
              },
              properties: {}, // Add an empty properties object
            },
          },
          paint: {
            "circle-radius": {
              stops: [
                [0, 0],
                [20, radiusInMeters / 3],
              ],
              base: 2,
            },
            "circle-color": "#0089BF",
            "circle-opacity": 0.3,
            "circle-stroke-width": 2,
            "circle-stroke-color": "#00BF0A",
          },
        });
      }
    };

    marker.on("drag", () => {
      const lngLat = marker.getLngLat();
      addCircle(lngLat);
    });

    marker.on("dragend", () => {
      const lngLat = marker.getLngLat();
      fetchAddress(lngLat);
      addCircle(lngLat);
    });

    geocoder.on("result", (event) => {
      const lngLat = event.result.geometry.coordinates;
      marker.setLngLat(lngLat);
      map.flyTo({ center: lngLat });
      setAddress(event.result.place_name);
      onSelectedAddress(event.result.place_name);
      addCircle(marker.getLngLat());
    });

    map.on("click", (event: mapboxgl.MapMouseEvent) => {
      const lngLat = event.lngLat;
      marker.setLngLat(lngLat);
      fetchAddress(lngLat);
      addCircle(lngLat);
    });

    map.on("load", () => {
      addCircle(map.getCenter());
    });

    return () => map.remove();
  }, [onSelectedAddress]);

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
