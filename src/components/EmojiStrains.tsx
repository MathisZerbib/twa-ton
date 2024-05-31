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
          <StrainText>
            {strainEmojis[strain] || "❓"} {strain}
          </StrainText>
        </Chip>
      ))}
    </div>
  );
};

export default EmojiStrains;
