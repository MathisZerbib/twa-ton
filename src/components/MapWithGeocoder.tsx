import React, { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import MapboxGeocoder from "@mapbox/mapbox-gl-geocoder";
import "mapbox-gl/dist/mapbox-gl.css";
import "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css";

// Assuming VITE_MAPBOX_ACCESS_TOKEN is correctly set in your environment variables
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

interface MapWithGeocoderProps {
  onSelectedAddress: (address: string) => void; // Define the prop type
}

const MapWithGeocoder: React.FC<MapWithGeocoderProps> = ({
  onSelectedAddress,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const searchBarRef = useRef<HTMLInputElement>(null);
  const [address, setAddress] = React.useState("");

  useEffect(() => {
    if (!mapRef.current) return;

    const map = new mapboxgl.Map({
      container: mapRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [-79.4512, 43.6568], // Starting position [lng, lat]
      zoom: 13, // Starting zoom
    });

    const geocoder = new MapboxGeocoder({
      accessToken: mapboxgl.accessToken,
      mapboxgl: mapboxgl,
    });
    map.addControl(geocoder);

    map.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true,
        },
        // When active the map will receive updates to the device's location as it changes.
        trackUserLocation: true,
        // Draw an arrow next to the location dot to indicate which direction the device is heading.
        showUserHeading: true,
      })
    );

    geocoder.on("result", (result) => {
      console.log("Selected address:", result.result.place_name);
      setAddress(result.result.place_name);
      onSelectedAddress(result.result.place_name); // Call the prop function with the selected address
    });

    return () => map.remove(); // Cleanup on unmount
  }, [onSelectedAddress]); // Add onSelectedAddress as a dependency

  return (
    <div>
      <div ref={mapRef} style={{ width: "100%", height: "100vh" }}></div>
    </div>
  );
};

export default MapWithGeocoder;
