import { ProductProps } from "../components/types";

const products: ProductProps[] = [
  {
    id: "1",
    imageUrl: "product_1.png",
    name: "Blue Dream",
    grams: 3.5,
    rating: 4.5,
    strains: ["sleepy", "happy"],
    price: 0.002,
  },
  {
    id: "2",
    imageUrl: "product_2.png",
    name: "Girl Scout Cookies",
    grams: 3.5,
    rating: 4.0,
    strains: ["hungry", "euphoric"],
    price: 0.001,
  },
  {
    id: "3",
    imageUrl: "product_3.png",
    name: "OG Kush",
    grams: 3.5,
    rating: 5.0,
    strains: ["relaxed", "uplifted"],
    price: 0.003,
  },
  {
    id: "4",
    imageUrl: "product_4.png",
    name: "Sour Diesel",
    grams: 3.5,
    rating: 3,
    strains: ["creative", "focused"],
    price: 0.002,
  },
  {
    id: "5",
    imageUrl: "product_5.png",
    name: "Cheese Quake",
    grams: 3.5,
    rating: 5,
    strains: ["energetic", "talkative"],
    price: 0.004,
  },
  {
    id: "6",
    imageUrl: "product_6.png",
    name: "Pineapple Express",
    grams: 3.5,
    rating: 3.5,
    strains: ["tingly", "aroused"],
    price: 0.002,
  },
  // Add more products as needed
];

export default products;
