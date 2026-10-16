import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const defaultProducts = [
  {
    badge: 'Bestseller',
    name: 'Personalized Wooden Photo Frame',
    material: 'Teak Wood · A4 Size',
    price: 749,
    originalPrice: 1199,
    stock: 12,
    rating: 4.8,
    reviews: 210,
    category: 'Wood Engravings',
    description:
      'Handcrafted teak photo frame with premium laser engraving. Perfect for anniversaries and wedding gifts.',
    isFeatured: true
  },
  {
    name: 'LED Acrylic Name Plate',
    material: 'Transparent Acrylic · USB Powered',
    price: 1299,
    stock: 7,
    rating: 4.4,
    reviews: 128,
    category: 'Acrylic / LED',
    description: 'Edge-lit acrylic nameplate with custom engraving and soft ambient glow.',
    isFeatured: true
  },
  {
    badge: 'New',
    name: 'Crystal Corporate Trophy',
    material: 'K9 Crystal · Custom Logo',
    price: 2499,
    originalPrice: 3200,
    stock: 4,
    rating: 4.9,
    reviews: 67,
    category: 'Corporate Awards',
    description: 'Premium crystal trophy with precision engraving for corporate milestones.',
    isFeatured: true
  },
  {
    name: 'Mandala Wall Art Panel',
    material: 'MDF Wood · 24×24 Inch',
    price: 1899,
    stock: 9,
    rating: 4.2,
    reviews: 85,
    category: 'Festival Gifts',
    description: 'Intricate mandala wall art laser-cut on MDF with a rich matte finish.',
    isFeatured: true
  },
  {
    badge: 'Sale',
    name: 'Engraved Leather Wallet',
    material: 'Genuine Leather · Custom Monogram',
    price: 899,
    originalPrice: 1400,
    stock: 18,
    rating: 4.3,
    reviews: 92,
    category: 'Leather Items',
    description: 'Personalized leather wallet with deep laser engraving and premium stitching.',
    isFeatured: true
  },
  {
    name: 'Bamboo Business Card Holder',
    material: 'Eco Bamboo · Logo Engraving',
    price: 549,
    stock: 25,
    rating: 4.1,
    reviews: 53,
    category: 'Corporate Awards',
    description: 'Minimal bamboo desktop card holder with engraved branding.',
    isFeatured: true
  },
  {
    name: 'Engraved Gift Hamper Box',
    material: 'MDF Wood · Custom Lid',
    price: 1699,
    stock: 6,
    rating: 4.7,
    reviews: 174,
    category: 'Wedding Gifts',
    description: 'Gift hamper box with engraved lid. Ideal for weddings and festive gifting.'
  },
  {
    name: 'Acrylic House Nameplate',
    material: 'Clear Acrylic · LED Edge',
    price: 2199,
    stock: 3,
    rating: 4.2,
    reviews: 66,
    category: 'Acrylic / LED',
    description: 'Custom LED nameplate for homes and offices with crisp engraving.'
  }
];

function toSlug(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminEmail || !adminPassword) throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD are required to seed an admin user.');

  const existingAdmin = await prisma.adminUser.findUnique({ where: { email: adminEmail } });
  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    await prisma.adminUser.create({
      data: {
        email: adminEmail,
        passwordHash
      }
    });
  }

  for (const product of defaultProducts) {
    const slug = toSlug(product.name);
    await prisma.product.upsert({
      where: { slug },
      update: { ...product },
      create: {
        ...product,
        slug
      }
    });
  }

  // Default custom order pricing (editable in Admin)
  const defaultMaterials = [
    { kind: 'material', name: 'Wood', price: 499 },
    { kind: 'material', name: 'Acrylic', price: 699 },
    { kind: 'material', name: 'Leather', price: 599 }
  ];
  const defaultSizes = [
    { kind: 'size', name: 'A5', price: 199 },
    { kind: 'size', name: 'A4', price: 299 },
    { kind: 'size', name: 'A3', price: 499 },
    { kind: 'size', name: 'A2', price: 799 },
    { kind: 'size', name: 'Custom', price: 0 }
  ];

  for (const row of [...defaultMaterials, ...defaultSizes]) {
    await prisma.customOrderPricing.upsert({
      where: { kind_name: { kind: row.kind, name: row.name } },
      update: { price: row.price },
      create: row
    });
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
