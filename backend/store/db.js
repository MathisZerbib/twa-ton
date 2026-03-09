const { PrismaClient } = require('@prisma/client');

// Optimize connection pooling for Serverless/Node
const prisma = new PrismaClient();

module.exports = prisma;
