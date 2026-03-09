import React from "react";
import Lottie from "lottie-react";
import deliveryBikeAnimation from "../../public/assets/food-delivery-bike.json";

interface LoadingAnimationProps {
  message?: string;
  size?: number;
}

const LoadingAnimation: React.FC<LoadingAnimationProps> = ({
  message,
  size = 180,
}) => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "40px 0",
      gap: 4,
    }}
  >
    <Lottie
      animationData={deliveryBikeAnimation}
      loop
      autoplay
      style={{ width: size, height: size }}
    />
    {message && (
      <p
        style={{
          margin: 0,
          fontSize: "0.95rem",
          fontWeight: 600,
          color: "#888",
        }}
      >
        {message}
      </p>
    )}
  </div>
);

export default LoadingAnimation;
