import { Typography } from "@mui/material";
import { Chip, StrainText } from "./styled/styled";
// EmojiStrains component
const EmojiStrains = ({ strains }: { strains: string[] }) => {
  // Mapping of strain types to their corresponding emojis
  const strainEmojis: { [key: string]: string } = {
    sleepy: "😴",
    happy: "😀",
    hungry: "🍔",
    euphoric: "😇",
    relaxed: "😌",
    uplifted: "🚀",
    creative: "🎨",
    focused: "🧠",
    energetic: "🔋",
    talkative: "💬",
    tingly: "🌟",
    aroused: "🔞",
    giggly: "😂",
  };

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "5px",
        justifyContent: "start",
      }}
    >
      {strains.length === 0 && <StrainText>No strains available</StrainText>}
      {strains.map((strain) => (
        <Chip key={strain}>
          <Typography
            style={{ fontSize: "0.8rem", color: "var(--tg-theme-text-color)" }}
          >
            {strainEmojis[strain] || "❓"} {strain}
          </Typography>
        </Chip>
      ))}
    </div>
  );
};

export default EmojiStrains;
