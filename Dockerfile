# Используем официальный образ Node.js
FROM node:20
LABEL authors="Khann"

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install

# Копируем весь проект
COPY . .

# Компилируем TypeScript в JavaScript
RUN npx tsc

# Указываем команду для запуска приложения
CMD ["node", "dist/main.js"]