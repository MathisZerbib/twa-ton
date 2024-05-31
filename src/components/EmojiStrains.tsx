import React from "react";
import styled from "styled-components";

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

  // Styled component for the chip with glassmorphism
  const Chip = styled.span`
    background-color: rgba(255, 255, 255, 0.1);
    border-color: rgba(0, 0, 0, 0.48);
    border-style: solid;
    border-width: 1px;
    color: #333;
    border-radius: 15px;
    padding: 5px 10px;
    margin-right: 5px;
    margin-bottom: 5px;
    font-size: 12px;
    display: inline-flex;
    align-items: center;
    gap: 5px;
    backdrop-filter: blur(10px);

    transition: all 0.3s ease;

    &:hover {
      background-color: rgba(255, 255, 255, 0.2);
    }
  `;

  const StrainText = styled.p`
    margin: 0;
    font-size: 12px;
    color: inherit;
  `;

  // Map each strain to its emoji and render it inside a chip
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
