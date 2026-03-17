const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const WALLETS = [
  '0QCFEF5jY33lLFJugJmFuILYQcwg7ekHu8LVsBpV7JbIT6FB', // Burger Palace
  '0QA_rF6pM93lLFJugJmFuILYQcwg7ekHu8LVsBpV7JbIT6Z2', // Sushi Zen
  '0QB_sD5qN82kKGIuhIlEtHLXPdvf6fjGt7KUrAmW6IcJS7X3'  // Pizza Paradiso
];

const restaurants = [
  {
    name: 'Burger Palace',
    category: 'American',
    description: 'The best gourmet burgers in town, flame-grilled to perfection.',
    merchantWallet: WALLETS[0],
    lat: 45.916672,
    lng: 6.86667,
    imageUrl: '/assets/photos/burger.png',
    bannerUrl: '/assets/photos/burger_palace.png',
    products: [
      { name: 'Classic Cheeseburger', description: 'Angus beef, cheddar, lettuce, tomato, special sauce', priceUsdt: 8.5, imageUrl: '/assets/photos/burger.png', category: 'burgers' },
      { name: 'Bacon Double Smash', description: 'Double patty, crispy bacon, american cheese', priceUsdt: 12.0, imageUrl: '/assets/photos/burger.png', category: 'burgers' },
      { name: 'Crispy Fries', description: 'Golden shoestring fries with sea salt', priceUsdt: 3.5, imageUrl: '/assets/photos/burger.png', category: 'sides' },
      { name: 'Onion Rings', description: 'Crispy beer-battered onion rings', priceUsdt: 4.5, imageUrl: '/assets/photos/burger.png', category: 'sides' },
      { name: 'Vanilla Milkshake', description: 'Creamy vanilla bean milkshake', priceUsdt: 5.0, imageUrl: '/assets/photos/burger.png', category: 'sides' },
      /// super cheap for test 
      { name: 'Super Cheap Burger', description: 'Super cheap burger', priceUsdt: 0.01, imageUrl: '/assets/photos/burger.png', category: 'burgers' },
      { name: 'Super Cheap Fries', description: 'Super cheap fries', priceUsdt: 0.01, imageUrl: '/assets/photos/burger.png', category: 'sides' },
    ]
  },
  {
    name: 'Sushi Zen',
    category: 'Japanese',
    description: 'Fresh, authentic sushi and sashimi prepared by master chefs.',
    merchantWallet: WALLETS[1],
    lat: 45.916172,
    lng: 6.86617,
    imageUrl: '/assets/photos/sushi.png',
    bannerUrl: '/assets/photos/sushi_zen.png',
    products: [
      { name: 'Salmon Nigiri (2pc)', description: 'Fresh salmon over seasoned rice', priceUsdt: 5.0, imageUrl: '/assets/photos/sushi.png', category: 'sushi' },
      { name: 'Spicy Tuna Roll', description: 'Tuna, spicy mayo, cucumber', priceUsdt: 8.0, imageUrl: '/assets/photos/sushi.png', category: 'sushi' },
      { name: 'Dragon Roll', description: 'Eel, crab, cucumber topped with avocado', priceUsdt: 12.0, imageUrl: '/assets/photos/sushi.png', category: 'sushi' },
      { name: 'Edamame', description: 'Steamed soybeans with sea salt', priceUsdt: 4.0, imageUrl: '/assets/photos/sushi.png', category: 'sides' },
      { name: 'Miso Soup', description: 'Traditional tofu and seaweed soup', priceUsdt: 2.5, imageUrl: '/assets/photos/sushi.png', category: 'sides' }
    ]
  },
  {
    name: 'Pizza Paradiso',
    category: 'Italian',
    description: 'Wood-fired Neapolitan pizza made with imported Italian ingredients.',
    merchantWallet: WALLETS[2],
    lat: 45.916142,
    lng: 6.86627,
    imageUrl: '/assets/photos/pizza.png',
    bannerUrl: '/assets/photos/pizza_paradiso.png',
    products: [
      { name: 'Margherita', description: 'San Marzano tomato, fresh mozzarella, basil', priceUsdt: 11.0, imageUrl: '/assets/photos/pizza.png', category: 'pizzas' },
      { name: 'Pepperoni', description: 'Tomato, mozzarella, spicy pepperoni', priceUsdt: 13.5, imageUrl: '/assets/photos/pizza.png', category: 'pizzas' },
      { name: 'Quattro Formaggi', description: 'Mozzarella, gorgonzola, parmesan, fontina', priceUsdt: 15.0, imageUrl: '/assets/photos/pizza.png', category: 'pizzas' },
      { name: 'Tiramisu', description: 'Classic Italian coffee-flavored dessert', priceUsdt: 6.0, imageUrl: '/assets/photos/pizza.png', category: 'sides' },
      { name: 'Garlic Knots', description: 'Baked dough tossed in garlic butter and parmesan', priceUsdt: 4.5, imageUrl: '/assets/photos/pizza.png', category: 'sides' }
    ]
  }
];

async function seed(clear = true) {
  console.log('🌱 Starting seed...');

  if (clear) {
    await prisma.product.deleteMany({});
    await prisma.merchant.deleteMany({});
    console.log('🧹 Database cleared.');
  }

  for (const store of restaurants) {
    const { products, ...merchantData } = store;
    
    await prisma.merchant.create({
      data: {
        ...merchantData,
        products: {
          create: products
        }
      }
    });
    console.log(`🍔 Created restaurant: ${store.name} with ${products.length} items`);
  }

  console.log('🎉 Seeding finished.');
}

if (require.main === module) {
  seed()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

module.exports = { seed, restaurants };
