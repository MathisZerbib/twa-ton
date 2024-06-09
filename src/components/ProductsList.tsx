// src/components/ProductsList.tsx
import React from "react";
import Slider from "react-slick";
import BuyCard from "./BuyCard";
import { ProductProps } from "./types";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { Typography } from "@mui/material";

interface ProductsListProps {
  products: ProductProps[];
}

const ProductsList: React.FC<ProductsListProps> = ({ products }) => {
  const settings = {
    dots: false,
    arrows: false,
    infinite: false,
    speed: 500,
    slidesToShow: 3,
    slidesToScroll: 3,

    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 2,
          infinite: false,
          dots: false,
        },
      },
      {
        breakpoint: 600,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
        },
      },
    ],
  };

  const flowers = products
    .filter((product) => product.category === "flowers")
    .slice(0, 8);
  const hash = products
    .filter((product) => product.category === "hash")
    .slice(0, 8);
  const oils = products
    .filter((product) => product.category === "oils")
    .slice(0, 8);

  return (
    <>
      <Typography
        variant="h3"
        style={{ textAlign: "start", marginBottom: "20px" }}
      >
        Flowers
      </Typography>

      <Slider {...settings}>
        {flowers.map((product) => (
          <BuyCard {...product} key={product.id} />
        ))}
      </Slider>

      <br />
      <br />

      <Typography
        variant="h3"
        style={{ textAlign: "start", marginBottom: "20px" }}
      >
        Hash
      </Typography>

      <Slider {...settings}>
        {hash.map((product) => (
          <BuyCard {...product} key={product.id} />
        ))}
      </Slider>

      <br />
      <br />
      <Typography
        variant="h3"
        style={{ textAlign: "start", marginBottom: "20px" }}
      >
        Oils
      </Typography>

      <Slider {...settings}>
        {oils.map((product) => (
          <BuyCard {...product} key={product.id} />
        ))}
      </Slider>
    </>
  );
};

export default ProductsList;
