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
      minHeight: "100vh",
      background: "var(--bg-primary)",
      gap: 16,
    }}
  >
    <Lottie
      animationData={deliveryBikeAnimation}
      loop
      autoplay
      style={{ width: size, height: size, filter: "drop-shadow(0 10px 20px rgba(0,0,0,0.1))" }}
    />
    {message && (
      <p
        style={{
          margin: 0,
          fontSize: "1rem",
          fontWeight: 800,
          color: "var(--text-secondary)",
          letterSpacing: "-0.01em",
        }}
      >
        {message}
      </p>
    )}
  </div>
);

export default LoadingAnimation;
