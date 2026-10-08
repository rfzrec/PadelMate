# PadelMate — Microservices Refactor

Versi ini adalah refactor dari project PadelMate asli menjadi arsitektur microservices.

## Arsitektur

```text
Browser
   |
   v
API Gateway :3000
   |---- /api/auth     -> Auth Service :3004
   |---- /api/courts   -> Court Service :3001
   |---- /api/bookings -> Booking Service :3002
   |---- /api/matches  -> Match Service :3003
   |
   +---- static frontend
                 |
                 v
              MySQL :3306
```

## Service

- **Gateway**: static frontend + routing API.
- **Auth Service**: register, login, current user.
- **Court Service**: court CRUD.
- **Booking Service**: booking, availability/conflict validation, history/cancel.
- **Match Service**: open match, join/leave, split payment.
- **MySQL**: database bersama untuk menjaga kompatibilitas dengan project awal.

> Database masih shared. Ini adalah tahap refactor microservices yang aman untuk project tugas karena setiap domain backend sudah dipisahkan menjadi service independen. Database-per-service bisa menjadi tahap lanjutan.

## Menjalankan

Pastikan Docker Desktop sedang berjalan.

```bash
docker compose up --build
```

Kemudian buka:

```text
http://localhost:3000
```

Cek container:

```bash
docker compose ps
```

Cek gateway:

```text
http://localhost:3000/api/health
```

Cek service langsung dari host:

```text
http://localhost:3001/api/health
http://localhost:3002/api/health
http://localhost:3003/api/health
http://localhost:3004/api/health
```

## Menghentikan

```bash
docker compose down
```

Untuk menghapus database dan membuat ulang dari `database_init.sql`:

```bash
docker compose down -v
docker compose up --build
```

**Perhatian:** `down -v` menghapus data MySQL pada volume Docker.

## Akun seed

- admin@padelmate.com / admin123
- eka@padelmate.com / eka123
- budi@padelmate.com / budi123
- andi@padelmate.com / andi123

## Struktur

```text
PadelMate/
├── frontend/
├── gateway/
│   ├── server.js
│   ├── Dockerfile
│   └── package.json
├── services/
│   ├── auth-service/
│   ├── court-service/
│   ├── booking-service/
│   └── match-service/
├── database_init.sql
├── docker-compose.yml
└── README.md
```
