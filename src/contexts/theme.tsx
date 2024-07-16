import { createContext, useState, useEffect, ReactNode } from "react";
import PropTypes from "prop-types";

// Define PropTypes for TypeScript
const ThemeContextType = {
  themeName: PropTypes.string,
  toggleTheme: PropTypes.func,
};

const lightTheme = {
  bgColor: "#ffffff",
  textColor: "#333333",
  buttonColor: "#2eaddc",
  buttonText: "#ffffff",
};

const darkTheme = {
  bgColor: "#2e2e2e",
  textColor: "#ffffff",
  buttonColor: "#1c8abf",
  buttonText: "#ffffff",
};

// Create the ThemeContext with initial value null
const ThemeContext = createContext<
  { themeName: string; toggleTheme: () => void }[] | null
>(null);

// ThemeProvider component
const ThemeProvider = ({ children }: { children: ReactNode }) => {
  // Initialize themeName state with default "light" or value from localStorage
  const [themeName, setThemeName] = useState<string>(() => {
    const storedTheme = localStorage.getItem("themeName");
    return storedTheme || "light"; // Default to "light" if no themeName is stored
  });

  // Effect to listen to changes in user's system theme preference
  useEffect(() => {
    const darkMediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = (e: MediaQueryListEvent) => {
      setThemeName(e.matches ? "dark" : "light");
    };

    darkMediaQuery.addEventListener("change", handleChange);
    return () => darkMediaQuery.removeEventListener("change", handleChange);
  }, []);

  // Function to toggle between dark and light themes
  const toggleTheme = () => {
    const newTheme = themeName === "dark" ? "light" : "dark";
    localStorage.setItem("themeName", newTheme);
    setThemeName(newTheme);
  };

  return (
    <ThemeContext.Provider value={[{ themeName, toggleTheme }]}>
      {children}
    </ThemeContext.Provider>
  );
};

// PropTypes validation
ThemeProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export { ThemeProvider, ThemeContext, ThemeContextType };
