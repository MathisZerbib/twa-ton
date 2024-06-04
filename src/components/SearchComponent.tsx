// SearchComponent.tsx
import React, { useState, useCallback } from "react";
import styled from "styled-components";
import { Options, SearchResultItem } from "nominatim-client";
import nominatim from "nominatim-client";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLocationArrow } from "@fortawesome/free-solid-svg-icons";

const SearchContainer = styled.div`
  margin-top: 20px;
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

interface SearchComponentProps {
  onAddressSelect: (address: string) => void;
}

const SearchComponent: React.FC<SearchComponentProps> = ({
  onAddressSelect,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState<SearchResultItem[]>([]);

  const fetchSuggestions = useCallback(async () => {
    if (searchTerm.length < 3) {
      setSuggestions([]);
      return;
    }

    try {
      const client = nominatim.createClient({
        useragent: "ReactApp",
        referer: "http://localhost",
      });
      const data = await client.search({ q: searchTerm, addressdetails: 1 });
      setSuggestions(data);
    } catch (error) {
      console.error("Error fetching address suggestions:", error);
    }
  }, [searchTerm]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    fetchSuggestions();
  };

  const handleSuggestionClick = (suggestion: SearchResultItem) => {
    onAddressSelect(suggestion.display_name);
    setSuggestions([]);
  };

  return (
    <SearchContainer>
      <SearchInput
        type="text"
        value={searchTerm}
        onChange={handleInputChange}
        placeholder="Enter address"
      />
      <SuggestionsList>
        {suggestions.map((suggestion) => (
          <SuggestionItem
            key={suggestion.place_id}
            onClick={() => handleSuggestionClick(suggestion)}
          >
            {suggestion.display_name}
          </SuggestionItem>
        ))}
      </SuggestionsList>
    </SearchContainer>
  );
};

export default SearchComponent;
