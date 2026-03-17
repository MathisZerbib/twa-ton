import styled, { keyframes } from "styled-components";

const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

export const SkeletonBase = styled.div`
  background: linear-gradient(90deg, 
    var(--bg-tertiary) 25%, 
    var(--bg-secondary) 50%, 
    var(--bg-tertiary) 75%
  );
  background-size: 200% 100%;
  animation: ${shimmer} 1.5s infinite linear;
  border-radius: 8px;
`;

export const SkeletonCard = styled(SkeletonBase)`
  width: 100%;
  height: 250px;
  border-radius: var(--card-radius);
  margin-bottom: 20px;
`;

export const SkeletonLine = styled(SkeletonBase)<{ $width?: string; $height?: string }>`
  width: ${p => p.$width || "100%"};
  height: ${p => p.$height || "16px"};
  margin-bottom: 10px;
`;

export const SkeletonCircle = styled(SkeletonBase)`
  width: 50px;
  height: 50px;
  border-radius: 50%;
`;
