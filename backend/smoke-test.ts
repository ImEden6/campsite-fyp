
import { getPrismaClient } from './src/database';

const prisma = getPrismaClient();

async function main() {
    console.log('Smoke test: Connecting to database...');
    try {
        const result = await prisma.$queryRaw`SELECT 1`;
        console.log('Smoke test: Connection successful!', result);
    } catch (error) {
        console.error('Smoke test: Connection failed!', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
