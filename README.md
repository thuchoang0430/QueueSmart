# QueueSmart – Smart Queue Management System

QueueSmart is a full-stack queue management application developed for COSC. The project allows users to join service queues while administrators manage queues in real time through a RESTful API.

---

## Features

### Authentication

- User registration
- User login
- Role-based authorization for users and administrators
- Authentication middleware for protected backend routes

### Service Management

- View available services
- View service descriptions
- View expected service duration
- Support service priority levels
- Create, update, and manage services as an administrator

### Queue Management

- Join a queue
- Leave a queue
- View current queue status
- Serve the next customer as an administrator
- Automatically order customers in the queue
- Support normal and priority queue entries

### Wait Time Estimation

- Estimate waiting time based on queue position
- Dynamically update wait time after queue changes
- Calculate queue position and expected service time

### Notification System

- Notify users after joining a queue
- Notify users when they are almost next
- Notify users when they have been served

### History

- View queue participation history
- View served history
- View leave history

---

## Latest Commit – My Contribution

For this commit, I integrated and added the full backend implementation to the `testing1` branch.

### Backend Development

- Added the Node.js, Express.js, and TypeScript backend structure
- Added the main Express application and server configuration
- Added centralized error handling
- Added authentication middleware
- Added request validation utilities

### API Modules

- Added authentication controllers, services, and routes
- Added queue controllers, services, and routes
- Added service-management controllers, services, and routes
- Added notification controllers, services, and routes
- Added queue-history controllers, services, and routes

### Queue Functionality

- Added logic for joining and leaving queues
- Added queue-status functionality
- Added serve-next-customer functionality
- Added queue ordering and priority handling
- Added estimated waiting-time calculations

### Database Setup

- Added Prisma configuration
- Added the Prisma schema
- Added the initial database migration
- Added the Prisma database client setup

### Testing

- Added Vitest configuration
- Added authentication route and service tests
- Added queue route and service tests
- Added service-management tests
- Added notification tests
- Added history tests
- Added validation tests
- Added shared test helpers

### Deployment and Configuration

- Added a GitHub Actions deployment workflow
- Updated the frontend Vite configuration
- Updated project `.gitignore` files
- Updated project documentation and package-lock files

Commit branch:

```text
testing1
```

Commit ID:

```text
33d5e1f
```

Commit message:

```text
Test second time login form changes
```

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
- Prisma

### Testing

- Vitest

### Development and Deployment

- Git
- GitHub
- GitHub Actions

---

## Project Structure

```text
QueueSmart/
│
├── frontend/
│   ├── public/
│   ├── src/
│   ├── package.json
│   └── vite.config.ts
│
├── backend/
│   ├── prisma/
│   ├── src/
│   ├── tests/
│   ├── package.json
│   ├── tsconfig.json
│   └── vitest.config.ts
│
├── .github/
│   └── workflows/
│       └── deploy.yml
│
├── README.md
└── package-lock.json
```

---

## Getting Started

### Clone the Repository

```bash
git clone https://github.com/thuchoang0430/QueueSmart.git
cd QueueSmart
```

To use the `testing1` branch:

```bash
git switch testing1
```

---

## Backend

```bash
cd backend
npm install
npm run dev
```

The backend runs on:

```text
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

The frontend runs on:

```text
http://localhost:5173
```

---

## Running Tests

Run the backend tests:

```bash
cd backend
npm test
```

Run type checking:

```bash
npm run typecheck
```

---

## Demo Accounts

### User

```text
Email: user@test.com
Password: password
```

### Administrator

```text
Email: admin@test.com
Password: password
```

---

## Notes

- The application includes a React frontend and an Express backend.
- Backend APIs are consumed by the React frontend.
- Prisma configuration and an initial database schema are included.
- Some application data may still use in-memory storage during development and testing.
- GitHub Pages hosts the frontend only.
- Local development requires both the backend and frontend servers.

---

## Team

Developed as part of COSC Assignment 3 – QueueSmart Smart Queue Management System.
