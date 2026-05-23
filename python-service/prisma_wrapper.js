const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');

// Load environment variables from the taketoday-app's .env.local
dotenv.config({ path: '/Users/ayushverma/Documents/Claude/Projects/TakeToday/taketoday-app/.env.local' });

const prisma = new PrismaClient();

// Get command line arguments
const [, , model, operation, argsJson] = process.argv;

if (!model || !operation || !argsJson) {
  console.error('Usage: node prisma_wrapper.js <model> <operation> <jsonArgs>');
  process.exit(1);
}

let args;
try {
  args = JSON.parse(argsJson);
} catch (e) {
  console.error('Invalid JSON args:', e.message);
  process.exit(1);
}

// Convert model name to the property name on the Prisma client (first letter lowercase)
const modelProp = model.charAt(0).toLowerCase() + model.slice(1);

async function run() {
  try {
    // Execute the operation
    const result = await prisma[modelProp][operation](args);
    // Output the result as JSON
    console.log(JSON.stringify(result));
  } catch (error) {
    console.error('Error executing Prisma operation:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

run();