// Existing imports...
import React, { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import styled from "styled-components";

// Fix for default marker icon issues with Webpack
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
});

L.Marker.prototype.options.icon = DefaultIcon;

const Container = styled.div`
  text-align: center;
`;

const Title = styled.h2`
  text-align: center;
`;

const SearchInput = styled.input`
  padding: 10px;
  width: 300px;
  border-radius: 4px;
  border: 1px solid #ccc;
  margin-bottom: 10px;
`;

const SuggestionsList = styled.ul`
  list-style-type: none;
  padding: 0;
  margin: 0;
  border: 1px solid #ccc;
  border-radius: 4px;
  max-height: 150px;
  overflow-y: auto;
  width: 300px;
  margin: 0 auto;
  text-align: left;
`;

const SuggestionItem = styled.li`
  padding: 10px;
  cursor: pointer;

  &:hover {
    background-color: #f0f0f0;
  }
`;

const RecenterAutomatically = ({ lat, lng }: { lat: number; lng: number }) => {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng]);
  }, [lat, lng]);
  return null;
};

const AutoFetchGeolocation: React.FC = () => {
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [error, setError] = useState("");
  const [chosenLocation, setChosenLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [address, setAddress] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [debounceTimeout, setDebounceTimeout] = useState<number | undefined>(
    undefined
  );
  const mapRef = useRef<L.Map>(null);

  useEffect(() => {
    const getLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const coords = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            };
            setLocation(coords);
            setChosenLocation(coords); // Set initial chosen location to current location
            fetchAddress(coords.latitude, coords.longitude);
          },
          (error) => {
            setError(error.message);
          }
        );
      } else {
        setError("Geolocation is not supported by this browser.");
      }
    };

    getLocation();
  }, []);

  const fetchAddress = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      );
      const data = await response.json();
      setAddress(data.display_name);
    } catch (error) {
      setError("Error fetching address");
    }
  };

  useEffect(() => {
    centerMap();
  }, [chosenLocation]);

  const handleMarkerDragEnd = async (event: L.DragEndEvent) => {
    const marker = event.target as L.Marker;
    const newPosition = marker.getLatLng();
    setChosenLocation({
      latitude: newPosition.lat,
      longitude: newPosition.lng,
    });
    await fetchAddress(newPosition.lat, newPosition.lng); // Fetch address based on new marker position
  };

  const fetchSuggestions = async (query: string) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${query}`
      );
      const data = await response.json();
      setSuggestions(data);
    } catch (error) {
      setError("Error fetching address suggestions");
    }
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAddress(value);

    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }

    if (value.length > 3) {
      const timeout = setTimeout(() => {
        fetchSuggestions(value);
      }, 300); // Adjust the debounce delay as needed
      setDebounceTimeout(timeout as unknown as number);
    } else {
      setSuggestions([]);
    }
  };

  const handleSuggestionClick = (suggestion: any) => {
    setAddress(suggestion.display_name);
    const newChosenLocation = {
      latitude: parseFloat(suggestion.lat),
      longitude: parseFloat(suggestion.lon),
    };
    setChosenLocation(newChosenLocation);
    setSuggestions([]);
    if (mapRef.current) {
      mapRef.current.setView(
        [newChosenLocation.latitude, newChosenLocation.longitude],
        13
      );
    }
  };

  const centerMap = () => {
    if (mapRef.current) {
      const centerLat = chosenLocation?.latitude ?? location?.latitude ?? 0;
      const centerLng = chosenLocation?.longitude ?? location?.longitude ?? 0;
      mapRef.current.setView([centerLat, centerLng], 18);
    }
  };

  return (
    <Container>
      <Title>Your Location</Title>
      <div
        style={{
          marginBottom: "20px",
        }}
      >
        <SearchInput
          type="text"
          value={address}
          onChange={handleAddressChange}
          placeholder="Enter address"
        />
        {suggestions.length > 0 && (
          <SuggestionsList>
            {suggestions.map((suggestion: any) => (
              <SuggestionItem
                key={suggestion.place_id}
                onClick={() => handleSuggestionClick(suggestion)}
              >
                {suggestion.display_name}
              </SuggestionItem>
            ))}
          </SuggestionsList>
        )}
      </div>
      {location ? (
        <MapContainer
          fadeAnimation={true}
          ref={mapRef}
          center={[
            chosenLocation?.latitude ?? location?.latitude ?? 0,
            chosenLocation?.longitude ?? location?.longitude ?? 0,
          ]}
          zoomAnimation={true}
          zoom={18}
          scrollWheelZoom={true}
          style={{ height: "70vh", width: "70vw", margin: "0 auto" }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <Marker
            position={[
              chosenLocation?.latitude ?? location.latitude,
              chosenLocation?.longitude ?? location.longitude,
            ]}
            eventHandlers={{
              dragend: handleMarkerDragEnd,
            }}
            draggable={true}
          >
            <Popup>
              Delivery Location: <br />
              Latitude: {chosenLocation?.latitude ?? location.latitude}
              <br />
              Longitude: {chosenLocation?.longitude ?? location.longitude}
            </Popup>
          </Marker>
          <RecenterAutomatically
            lat={chosenLocation?.latitude ?? location?.latitude ?? 0}
            lng={chosenLocation?.longitude ?? location?.longitude ?? 0}
          />
        </MapContainer>
      ) : (
        <p>Error: {error}</p>
      )}
    </Container>
  );
};

export default AutoFetchGeolocation;
