# Инструкция по деплою на сервер

## Параметры сервера

| Параметр | Значение |
|---|---|
| IP | `158.160.204.80` |
| SSH-пользователь | `kma` |
| Deploy path | `/var/www/docker-mesto` |
| Frontend URL | `https://kma.nomorepartiessbs.ru` |
| Backend URL | `https://api.kma.nomorepartiessbs.ru` |

---

## Шаг 1. Подключиться к серверу

```bash
ssh kma@158.160.204.80
```

---

## Шаг 2. Клонировать репозиторий

```bash
sudo mkdir -p /var/www/docker-mesto
sudo chown -R kma:kma /var/www/docker-mesto
git clone git@github.com:rootCurse/docker-mesto.git /var/www/docker-mesto
cd /var/www/docker-mesto
```

---

## Шаг 3. Создать .env файл

```bash
cp .env.example .env
nano .env
```

Заполнить реальными значениями:

```
POSTGRES_HOST=database
POSTGRES_USER=<реальный_пользователь>
POSTGRES_PASSWORD=<реальный_пароль>
POSTGRES_DB=kupipodariday
POSTGRES_PGDATA=/var/lib/postgresql/data/pgdata
JWT_SECRET=<реальный_секрет>
JWT_EXPIRES_IN=24h
```

---

## Шаг 4. Запустить контейнеры

```bash
docker compose up -d --build
```

Проверить, что все контейнеры запустились:

```bash
docker compose ps
docker compose logs -f
```

Ожидаемый результат:
- `backend` — запущен, слушает порт 3000 внутри / 4000 снаружи
- `frontend` — nginx запущен, порт 80 внутри / 8081 снаружи
- `database` — PostgreSQL запущен, порт 5432 только внутри сети

---

## Шаг 5. Настроить nginx на хосте

### Конфиг бэкенда

```bash
sudo nano /etc/nginx/sites-available/api.kma.nomorepartiessbs.ru
```

```nginx
server {
    listen 80;
    server_name api.kma.nomorepartiessbs.ru;

    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Конфиг фронтенда

```bash
sudo nano /etc/nginx/sites-available/kma.nomorepartiessbs.ru
```

```nginx
server {
    listen 80;
    server_name kma.nomorepartiessbs.ru;

    location / {
        proxy_pass http://localhost:8081;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Включить сайты и перезапустить nginx

```bash
sudo ln -s /etc/nginx/sites-available/api.kma.nomorepartiessbs.ru /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/kma.nomorepartiessbs.ru /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

---

## Шаг 6. Выпустить SSL-сертификаты

```bash
sudo certbot --nginx -d kma.nomorepartiessbs.ru -d api.kma.nomorepartiessbs.ru
```

Certbot автоматически обновит конфиги nginx для HTTPS и настроит редирект с HTTP.

Проверить автообновление:

```bash
sudo certbot renew --dry-run
```

---

## Шаг 7. Обновление (после изменений в репозитории)

```bash
cd /var/www/docker-mesto
git pull origin deploy
docker compose up -d --build
```

---

## Верификация

| Проверка | Ожидаемый результат |
|---|---|
| `curl http://localhost:4000` | Бэкенд отвечает |
| `curl http://localhost:8081` | Nginx отвечает |
| `https://kma.nomorepartiessbs.ru` | Фронтенд открывается по HTTPS |
| `https://api.kma.nomorepartiessbs.ru` | Бэкенд доступен по HTTPS |
| Регистрация / авторизация | Работает |
| Создание/удаление желаний | Работает |
