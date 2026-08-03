# QueueSmart – Smart Queue Management System

QueueSmart is a full-stack queue management application developed for COSC. The project allows users to join service queues while administrators manage queues in real time through a RESTful API.

---

## Features

### Authentication
- User registration
- User login
- Role-based authorization (User/Admin)

### Service Management
- View available services
- Service descriptions
- Expected service duration
- Priority levels

### Queue Management
- Join a queue
- Leave a queue
- View current queue status
- Serve next customer (Admin)
- Automatic queue ordering

### Wait Time Estimation
- Estimated waiting time based on queue position
- Dynamic updates after queue changes

### Notification System
- User joins queue
- User is almost next
- User served notifications

### History
- Queue participation history
- Served history
- Leave history

---

## Tech Stack

### Frontend
- React
- TypeScript
- Vite
- Tailwind CSS

### Backend
- Node.js
- Express.js
- TypeScript

### Testing
- Vitest

---

## Project Structure

```
QueueSmart-A2/
│
├── frontend/
│   ├── src/
│   ├── public/
│   └── vite.config.ts
│
├── backend/
│   ├── src/
│   ├── tests/
│   └── package.json
│
└── .github/
    └── workflows/
```

---

## Getting Started

### Clone Repository

```bash
git clone https://github.com/thuchoang0430/QueueSmart.git
cd QueueSmart
```

---

## Backend

```bash
cd backend
npm install
npm run dev
```

Backend runs on:

```
http://localhost:4000
```

---

## Frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on:

```
http://localhost:5173
```

---

## Running Tests

Backend tests:

```bash
cd backend
npm test
```

Type checking:

```bash
npm run typecheck
```

---

## Demo Accounts

### User

```
Email:
user@test.com

Password:
password
```

### Administrator

```
Email:
admin@test.com

Password:
password
```
---

## Notes

- Data is stored in memory.
- Backend APIs are consumed by the React frontend.
- GitHub Pages hosts the frontend only.
- Local development requires both backend and frontend servers.

---

## Team

Developed as part of COSC Assignment 3 – QueueSmart Smart Queue Management System.
