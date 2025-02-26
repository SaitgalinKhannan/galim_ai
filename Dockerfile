# Используем официальный образ Node.js
FROM node:20
LABEL authors="Khann"

# Создаем директорию для данных БД
RUN mkdir -p /app/data

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install

# Копируем весь проект
COPY . .

# Указываем точку монтирования для данных (опционально, но полезно для документации)
VOLUME /app/data

# Компилируем TypeScript в JavaScript
RUN npx tsc

# Указываем команду для запуска приложения
CMD ["node", "dist/main.js"]