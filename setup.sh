#First action for setup

echo "----------------------------- Installing all dependencies...";
npm install

echo "----------------------------- Syncing Prisma...";
npx prisma db pull && npx prisma generate

echo "----------------------------- Prepare Svelte 5...";
npm run prepare

echo "----------------------------- Check dependencies";
npm run check

echo "----------------------------- Build program";
npm run build

echo "----------------------------- Jalankan program setelah build";
npm run preview