import { useContext } from "react";
import { ThemeContext } from "../../contexts/theme";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMoon, faSun } from "@fortawesome/free-solid-svg-icons";

const ToggleBtn = () => {
  const contextValue = useContext(ThemeContext);
  const [{ themeName, toggleTheme }] = contextValue!;

  if (themeName === undefined || toggleTheme === undefined) {
    throw new Error(
      "themeName and toggleTheme must be defined in the context value"
    );
  } else {
    console.log("themeName and toggleTheme are defined on ", themeName);
  }

  // Define theme variables
  const darkTheme = {
    buttonColor: "##2e2e2e",
    buttonText: "#2e2e2e",
    iconColor: "##2e2e2e", // Color for dark mode icon
  };

  const lightTheme = {
    buttonColor: "#FFFFFF",
    buttonText: "#ffffff",
    iconColor: "#2e2e2e",
  };

  const themeStyles = themeName === "dark" ? darkTheme : lightTheme;

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="btn btn--icon"
      aria-label="toggle theme"
      style={{
        backgroundColor: `var(--tg-theme-button-color, ${themeStyles.buttonColor})`,
        border: "1px solid #2e2e2e",
        color: `var(--tg-theme-button-text-color, ${themeStyles.buttonText})`,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "0.8em",
        borderRadius: "8px",
        outline: "none",
        cursor: "pointer",
        transition: "background-color 0.3s, color 0.3s",
      }}
    >
      <FontAwesomeIcon
        icon={themeName === "light" ? faSun : faMoon}
        style={{
          color: `var(--tg-theme-icon-color, ${themeStyles.iconColor})`,
        }}
      />
    </button>
  );
};

export default ToggleBtn;
