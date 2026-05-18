npx -y create-vite@latest frontend --template react
cd frontend
npm install
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
npm install react-router-dom lucide-react date-fns axios
cd ..
mkdir backend
cd backend
npm init -y
npm install express cors sqlite3 date-fns
npm install -D nodemon
cd ..
