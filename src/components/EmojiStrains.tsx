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
    <div>
      {strains.map((strain) => (
        <Chip key={strain}>
          <Typography style={{ fontSize: "0.8rem", color: "#fff" }}>
            {strainEmojis[strain] || "❓"} {strain}
          </Typography>
        </Chip>
      ))}
    </div>
  );
};

export default EmojiStrains;
