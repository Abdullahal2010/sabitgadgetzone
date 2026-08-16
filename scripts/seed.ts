/**
 * Seeds the database with placeholder products so the storefront and admin
 * dashboard have something to show immediately.
 *
 * Run with:  npm run seed
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import Product from '../lib/models/Product';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/sabit-gadgets';

const products = [
  {
    title: 'Dentist Game Crazy Dinosaur',
    description: 'A quirky dexterity toy — pull the tooth without waking the dinosaur.',
    price: 1250,
    buyPrice: 980,
    imageUrl: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=600&q=80',
    stock: 24,
    category: 'New Arrival'
  },
  {
    title: 'K75 Shaking Head Cooling Fan',
    description: 'Desk fan with a wide oscillation head and three quiet speed settings.',
    price: 2950,
    buyPrice: 2510,
    imageUrl: 'https://images.unsplash.com/photo-1587730033483-06f5ee71f4a3?w=600&q=80',
    stock: 15,
    category: 'New Arrival'
  },
  {
    title: 'Mechanical Gaming Keyboard',
    description: 'RGB backlit, hot-swappable switches, pro-grade mechanical keyboard.',
    price: 4100,
    buyPrice: 3400,
    imageUrl: 'https://images.unsplash.com/photo-1541140532154-b024d705b90a?w=600&q=80',
    stock: 12,
    category: 'Gaming Accessories'
  },
  {
    title: 'RGB Gaming Mouse',
    description: '16000 DPI optical sensor with customizable RGB lighting.',
    price: 1450,
    buyPrice: 1120,
    imageUrl: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600&q=80',
    stock: 30,
    category: 'Gaming Accessories'
  },
  {
    title: 'Over-Ear Gaming Headset',
    description: 'Surround sound with a noise-cancelling mic, built for long sessions.',
    price: 2950,
    buyPrice: 2400,
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80',
    stock: 18,
    category: 'Gaming Accessories'
  },
  {
    title: 'Mini Drone with 4K Camera',
    description: 'Foldable mini drone with GPS return-to-home and a 4K camera.',
    price: 12500,
    buyPrice: 10800,
    imageUrl: 'https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=600&q=80',
    stock: 6,
    category: 'New Arrival'
  }
];

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to', MONGODB_URI);

  await Product.deleteMany({});
  await Product.insertMany(products);
  console.log(`Seeded ${products.length} products.`);

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
