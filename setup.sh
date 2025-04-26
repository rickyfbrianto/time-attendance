#First action for setup

echo "----------------------------- Installing all dependencies...";
pnpm install

echo "----------------------------- Syncing Prisma...";
pnpm prisma db pull && pnpm prisma generate

echo "----------------------------- Prepare Svelte 5...";
pnpm run prepare

echo "----------------------------- Build program";
pnpm run build

echo "----------------------------- Jalankan program setelah build";
pnpm run preview