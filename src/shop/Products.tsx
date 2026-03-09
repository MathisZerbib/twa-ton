import { ProductProps } from "../components/types";

// TON-Eats: Fast food products with realistic TON prices
const products: ProductProps[] = [
  // --- BURGERS ---
  {
    id: "1",
    category: "burgers",
    imageUrl: "/gourmet_burger.png",
    name: "Classic Smashburger",
    rating: 4.8,
    strains: ["Beef", "Cheese"],
    price: 3.5,
    description: "A perfectly smashed beef patty with American cheese, secret sauce, pickles, and caramelized onions on a toasted brioche bun.",
    storeId: "1"
  },
  {
    id: "2",
    category: "burgers",
    imageUrl: "/bacon_burger.png",
    name: "Double Bacon Stack",
    rating: 4.9,
    strains: ["Bacon", "Beef"],
    price: 5.0,
    description: "Two 120g smashed beef patties loaded with crispy streaky bacon, aged cheddar, burger sauce and fresh lettuce.",
    storeId: "1"
  },
  {
    id: "3",
    category: "burgers",
    imageUrl: "/gourmet_burger.png",
    name: "Spicy Jalapeño Crunch",
    rating: 4.6,
    strains: ["Spicy", "Crispy"],
    price: 4.2,
    description: "Crispy fried chicken breast, pickled jalapeños, ghost pepper mayo, and a drizzle of hot honey.",
    storeId: "1"
  },
  {
    id: "4",
    category: "burgers",
    imageUrl: "/gourmet_burger.png",
    name: "Mushroom Swiss Melt",
    rating: 4.5,
    strains: ["Veggie", "Umami"],
    price: 4.0,
    description: "A juicy beef patty topped with sautéed wild mushrooms, melted Swiss cheese, garlic aioli and baby spinach.",
    storeId: "1"
  },
  {
    id: "5",
    category: "burgers",
    imageUrl: "/gourmet_burger.png",
    name: "Truffle Signature",
    rating: 5.0,
    strains: ["Premium", "Truffle"],
    price: 6.5,
    description: "Our premium burger: dry-aged beef, black truffle mayo, caramelized shallots, aged Gruyère, and fresh arugula.",
    storeId: "1"
  },

  // --- PIZZAS ---
  {
    id: "7",
    category: "pizzas",
    imageUrl: "/classic_pizza.png",
    name: "Margherita Classica",
    rating: 4.7,
    strains: ["Tomato", "Mozzarella"],
    price: 4.5,
    description: "San Marzano tomato sauce, fresh fior di latte mozzarella, hand-torn basil and a drizzle of extra virgin olive oil.",
    storeId: "2"
  },
  {
    id: "8",
    category: "pizzas",
    imageUrl: "/pepperoni_pizza.png",
    name: "Pepperoni Volcano",
    rating: 4.9,
    strains: ["Spicy", "Meat"],
    price: 5.2,
    description: "Loaded with double pepperoni, hot honey, crushed chili flakes, and a mozzarella-provolone blend.",
    storeId: "2"
  },
  {
    id: "9",
    category: "pizzas",
    imageUrl: "/classic_pizza.png",
    name: "BBQ Chicken Ranch",
    rating: 4.6,
    strains: ["BBQ", "Chicken"],
    price: 5.5,
    description: "Grilled chicken, smoky BBQ sauce base, red onion, bacon crumbles, mozzarella and a drizzle of ranch.",
    storeId: "2"
  },
  {
    id: "10",
    category: "pizzas",
    imageUrl: "/classic_pizza.png",
    name: "4 Formaggi",
    rating: 4.8,
    strains: ["Creamy", "Cheese"],
    price: 5.8,
    description: "Gorgonzola, taleggio, mozzarella and parmigiano reggiano on a white cream base.",
    storeId: "2"
  },

  // --- SIDES & DRINKS (Assigned to Store 3) ---
  {
    id: "13",
    category: "sides",
    imageUrl: "/sides_tacos.png",
    name: "Loaded Fries",
    rating: 4.7,
    strains: ["Crispy", "Cheese"],
    price: 1.8,
    description: "Thick-cut fries topped with melted cheddar sauce, crispy bacon bits, chives and sour cream.",
    storeId: "3"
  },
  {
    id: "14",
    category: "sides",
    imageUrl: "/sides_tacos.png",
    name: "Spicy Tacos (x3)",
    rating: 4.6,
    strains: ["Spicy", "Mexican"],
    price: 3.2,
    description: "Three corn tortillas filled with slow-braised spicy beef, shredded cabbage, pickled onion, avocado crema and a habanero salsa.",
    storeId: "3"
  },
  {
    id: "15",
    category: "sides",
    imageUrl: "/wings.png",
    name: "Crispy Chicken Wings",
    rating: 4.8,
    strains: ["Crispy", "Chicken"],
    price: 2.5,
    description: "6 bone-in wings, double-fried for maximum crunch. Choose your sauce: buffalo, honey garlic, or classic BBQ.",
    storeId: "3"
  },
  {
    id: "17",
    category: "drinks",
    imageUrl: "/lemonade.png",
    name: "Sparkling Lemonade",
    rating: 4.5,
    strains: ["Fresh", "Cold"],
    price: 0.1,
    description: "House-pressed lemon juice, sparkling water, mint leaves and a hint of elderflower.",
    storeId: "3"
  },
  {
    id: "18",
    category: "drinks",
    imageUrl: "/craft_drinks.png",
    name: "Craft Milkshake",
    rating: 4.9,
    strains: ["Sweet", "Cold"],
    price: 1.5,
    description: "Hand-spun thick milkshake in your choice of: Vanilla Bean, Salted Caramel, Dark Chocolate or Mixed Berry.",
    storeId: "3"
  },
];

export default products;
