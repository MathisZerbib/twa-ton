import { Restaurant } from "../components/types";

export const restaurants: Restaurant[] = [
    {
        id: "1",
        name: "Smash & Co",
        category: "Burgers • American",
        imageUrl: "/burger_logo.png",
        bannerUrl: "/gourmet_burger.png",
        rating: 4.8,
        deliveryTime: "15-25 min",
        description: "The gold standard of smashed burgers on TON. 100% grass-fed beef, secret sauce, and brioche buns delivered hot and fast.",
        merchantWallet: "0QCFEF5jY33lLFJugJmFuILYQcwg7ekHu8LVsBpV7JbIT6FB", // Same as treasury for demo
        color: "#FF6B35"
    },
    {
        id: "2",
        name: "Pizza Volta",
        category: "Pizza • Italian",
        imageUrl: "/pizza_logo.png",
        bannerUrl: "/classic_pizza.png",
        rating: 4.9,
        deliveryTime: "25-40 min",
        description: "Authentic wood-fired Neapolitan pizzas. Every slice is a transaction of pure flavor. Decentralized taste, centralized quality.",
        merchantWallet: "0QCFEF5jY33lLFJugJmFuILYQcwg7ekHu8LVsBpV7JbIT6FB",
        color: "#F7931E"
    },
    {
        id: "3",
        name: "Taco Blockchain",
        category: "Mexican • Fusion",
        imageUrl: "/taco_logo.png",
        bannerUrl: "/sides_tacos.png",
        rating: 4.6,
        deliveryTime: "20-30 min",
        description: "Spicy tacos and loaded fries that settle instantly on your palate. The best Mexican fusion in the Metaverse.",
        merchantWallet: "0QCFEF5jY33lLFJugJmFuILYQcwg7ekHu8LVsBpV7JbIT6FB",
        color: "#FFD23F"
    }
];

export default restaurants;
