import React, { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import styled from "styled-components";
import { Options, ReverseOptions, SearchResultItem } from "nominatim-client";
import nominatim from "nominatim-client";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLocationArrow } from "@fortawesome/free-solid-svg-icons";

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
  background-color: #f9f9f9;
  color: #333;

  &:hover {
    background-color: #f0f0f0;
  }
`;

const ButtonGeoLocation = styled.button`
  padding: 10px;
  border: none;
  border-radius: 4px;
  background-color: #333;
  color: white;
  cursor: pointer;
  margin-bottom: 10px;

  &:hover {
    background-color: #555;
  }
`;

const MapWrapper = styled.div`
  height: 80vh;
  width: 100%;
  margin: 0 auto;
  position: relative;
`;

const RecenterAutomatically = ({ lat, lng }: { lat: number; lng: number }) => {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng]);
  }, [lat, lng]);
  return null;
};

interface AutoFetchGeolocationProps {
  onAddressClick: (address: string) => void;
}

const AutoFetchGeolocation: React.FC<AutoFetchGeolocationProps> = ({
  onAddressClick,
}) => {
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
  const [suggestions, setSuggestions] = useState<SearchResultItem[]>([]);
  const [debounceTimeout, setDebounceTimeout] = useState<number | undefined>(
    undefined
  );
  const mapRef = useRef<L.Map>(null);

  useEffect(() => {
    const getLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const coords = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            };
            setLocation(coords);
            setChosenLocation(coords); // Set initial chosen location to current location
            await fetchAddress(coords.latitude, coords.longitude);
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
      const client = nominatim.createClient({
        useragent: "MyApp", // The name of your application
        referer: "http://example.com", // The referer link
      });
      const result = await client.reverse({ lat, lon: lng });
      setAddress(result.display_name);
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
      const client = nominatim.createClient({
        useragent: "react-app",
        referer: "http://localhost",
      });
      const data = await client.search({ q: query, addressdetails: 1 });
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

  const handleSuggestionClick = (suggestion: SearchResultItem) => {
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
    // Call the onAddressClick callback with the selected address
    onAddressClick(suggestion.display_name);
  };

  const centerMap = () => {
    if (mapRef.current) {
      const centerLat = chosenLocation?.latitude ?? location?.latitude ?? 0;
      const centerLng = chosenLocation?.longitude ?? location?.longitude ?? 0;
      mapRef.current.setView([centerLat, centerLng], 18);
    }
  };

  const handleGeolocationClick = () => {
    // Trigger geolocation
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const coords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          setLocation(coords);
          setChosenLocation(coords); // Set chosen location to current
          location;
          await fetchAddress(coords.latitude, coords.longitude);
        },
        (error) => {
          setError(error.message);
        }
      );
    } else {
      setError("Geolocation is not supported by this browser.");
    }
  };

  return (
    <Container>
      <MapWrapper>
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
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <Marker
            position={[
              chosenLocation?.latitude ?? location?.latitude ?? 0,
              chosenLocation?.longitude ?? location?.longitude ?? 0,
            ]}
            eventHandlers={{
              dragend: handleMarkerDragEnd,
            }}
            draggable={true}
          >
            <Popup>
              Location de livraison: <br />
              Latitude: {chosenLocation?.latitude ?? location?.latitude ?? ""}
              <br />
              Longitude:{" "}
              {chosenLocation?.longitude ?? location?.longitude ?? ""}
            </Popup>
          </Marker>
          <RecenterAutomatically
            lat={chosenLocation?.latitude ?? location?.latitude ?? 0}
            lng={chosenLocation?.longitude ?? location?.longitude ?? 0}
          />
        </MapContainer>
        <Container
          style={{
            zIndex: 1000,
          }}
        >
          <div
            style={{
              position: "absolute",
              top: "5%",
              left: "5%",
              margin: "20px",
              backgroundColor: "#333",
              padding: "10px",
              borderRadius: "10px",
              width: "420px",
              zIndex: 1000,
            }}
          >
            <Title
              style={{
                marginBottom: "20px",
                color: "white",
              }}
            >
              Choisissez une adresse de livraison
            </Title>
            <div style={{}}>
              <SearchInput
                type="text"
                value={address}
                onChange={handleAddressChange}
                placeholder="Enter address"
              />
              <button
                style={{
                  padding: "10px",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  margin: "10px",
                  backgroundColor: "#333",
                  color: "white",
                }}
                onClick={() => onAddressClick(address)}
              >
                Valider l'adresse
              </button>
            </div>
            {suggestions.length > 0 && (
              <SuggestionsList>
                {suggestions.map((suggestion: SearchResultItem) => (
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
        </Container>
      </MapWrapper>
      <Container
        style={{
          position: "absolute",
          bottom: "5%",
          right: "1%",
          transform: "translate(-50%, -50%)",
          zIndex: 1000,
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          width: "100px",
        }}
      >
        <ButtonGeoLocation onClick={handleGeolocationClick}>
          <FontAwesomeIcon icon={faLocationArrow} />
        </ButtonGeoLocation>

        <ButtonGeoLocation
          onClick={() => {
            onAddressClick(address);
          }}
        >
          Valider l'adresse
        </ButtonGeoLocation>
      </Container>
    </Container>
  );
};

export default AutoFetchGeolocation;
