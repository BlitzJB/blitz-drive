const bcrypt = require('bcrypt');
const readline = require('readline');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

async function addUser() {
  try {
    const username = await question('Enter username: ');
    const password = await question('Enter password: ');

    // Hash the password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Add new user to the database
    const user = await prisma.user.create({
      data: {
        username,
        passwordHash,
      },
    });

    console.log(`User ${username} added successfully!`);
  } catch (error) {
    console.error('Error adding user:', error);
  } finally {
    await prisma.$disconnect();
    rl.close();
  }
}

addUser();