import { db } from './src/firebase';
import { products } from './src/data/products';
import { doc, setDoc } from 'firebase/firestore';

async function seed() {
  console.log('Seeding products to Firebase...');
  try {
    for (const p of products) {
      await setDoc(doc(db, 'products', p.id), p);
      console.log(`Successfully updated ${p.name}`);
    }
    console.log('Database seeded with new images!');
  } catch (error) {
    console.error('Error seeding DB:', error);
  }
  process.exit(0);
}
seed();
