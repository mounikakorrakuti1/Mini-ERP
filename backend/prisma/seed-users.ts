import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const firstNames = [
  'Aarav', 'Priya', 'Kiran', 'Divya', 'Rohan', 'Neha', 'Arjun', 'Sneha', 'Vikram', 'Meera',
  'Rahul', 'Isha', 'Nikhil', 'Ananya', 'Jay', 'Anjali', 'Siddharth', 'Pooja', 'Kunal', 'Sanya',
];
const lastNames = [
  'Sharma', 'Patel', 'Reddy', 'Singh', 'Kaur', 'Mehta', 'Kapoor', 'Nair', 'Gupta', 'Chopra',
  'Desai', 'Bose', 'Verma', 'Joshi', 'Malhotra', 'Agarwal', 'Das', 'Bhattacharya', 'Fernandes', 'Iyer',
];
const positions = [
  'Sales Executive', 'Purchase Officer', 'Manufacturing Lead', 'Warehouse Staff',
  'Customer Support', 'Quality Analyst', 'Business Analyst', 'Admin Assistant',
  'Procurement Specialist', 'Inventory Coordinator',
];

function getItem<T>(items: T[], index: number): T {
  return items[index % items.length];
}

async function main() {
  const passwordHash = await bcrypt.hash('User@123', 12);

  const users = Array.from({ length: 200 }, (_, index) => {
    const number = index + 1;
    const isActive = index % 10 !== 0; // every 10th user remains inactive until an admin activates them
    return {
      loginId: `dummy${String(number).padStart(4, '0')}`,
      email: `dummy${String(number).padStart(4, '0')}@example.com`,
      passwordHash,
      name: `${getItem(firstNames, index)} ${getItem(lastNames, index)}`,
      address: `${100 + index} Cloud Street, Bengaluru`,
      mobile: `+919000${String(100000 + index).slice(-6)}`,
      position: getItem(positions, index),
      active: isActive,
    };
  });

  await prisma.user.deleteMany({ where: { loginId: { startsWith: 'dummy' } } });

  const result = await prisma.user.createMany({
    data: users,
  });

  console.log(`Inserted ${result.count} dummy users.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
