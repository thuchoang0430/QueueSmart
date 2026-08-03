# QueueSmart – Smart Queue Management System

QueueSmart is a full-stack queue management application developed for COSC. The project allows users to join service queues while administrators manage queues in real time through a RESTful API.

---

## Features

### Authentication
<<<<<<< HEAD
<<<<<<< HEAD

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
=======
=======
>>>>>>> testing1
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
<<<<<<< HEAD
>>>>>>> origin/main
=======
>>>>>>> testing1

---

## Tech Stack

### Frontend
<<<<<<< HEAD
<<<<<<< HEAD

=======
>>>>>>> origin/main
=======
>>>>>>> testing1
- React
- TypeScript
- Vite
- Tailwind CSS

### Backend
<<<<<<< HEAD
<<<<<<< HEAD

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

=======
=======
>>>>>>> testing1
- Node.js
- Express.js
- TypeScript

### Testing
- Vitest

<<<<<<< HEAD
>>>>>>> origin/main
=======
>>>>>>> testing1
---

## Project Structure

<<<<<<< HEAD
<<<<<<< HEAD
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
=======
=======
>>>>>>> testing1
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
<<<<<<< HEAD
>>>>>>> origin/main
=======
>>>>>>> testing1
```

---

## Getting Started

<<<<<<< HEAD
<<<<<<< HEAD
### Clone the Repository
=======
### Clone Repository
>>>>>>> origin/main
=======
### Clone Repository
>>>>>>> testing1

```bash
git clone https://github.com/thuchoang0430/QueueSmart.git
cd QueueSmart
```

<<<<<<< HEAD
<<<<<<< HEAD
To use the `testing1` branch:

```bash
git switch testing1
```

=======
>>>>>>> origin/main
=======
>>>>>>> testing1
---

## Backend

```bash
cd backend
npm install
npm run dev
```

<<<<<<< HEAD
<<<<<<< HEAD
The backend runs on:

```text
=======
Backend runs on:

```
>>>>>>> origin/main
=======
Backend runs on:

```
>>>>>>> testing1
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

<<<<<<< HEAD
<<<<<<< HEAD
The frontend runs on:

```text
=======
Frontend runs on:

```
>>>>>>> origin/main
=======
Frontend runs on:

```
>>>>>>> testing1
http://localhost:5173
```

---

## Running Tests

<<<<<<< HEAD
<<<<<<< HEAD
Run the backend tests:
=======
Backend tests:
>>>>>>> origin/main
=======
Backend tests:
>>>>>>> testing1

```bash
cd backend
npm test
```

<<<<<<< HEAD
<<<<<<< HEAD
Run type checking:
=======
Type checking:
>>>>>>> origin/main
=======
Type checking:
>>>>>>> testing1

```bash
npm run typecheck
```

---

## Demo Accounts

### User

<<<<<<< HEAD
<<<<<<< HEAD
```text
Email: user@test.com
Password: password
=======
=======
>>>>>>> testing1
```
Email:
user@test.com

Password:
password
<<<<<<< HEAD
>>>>>>> origin/main
=======
>>>>>>> testing1
```

### Administrator

<<<<<<< HEAD
<<<<<<< HEAD
```text
Email: admin@test.com
Password: password
```

=======
=======
>>>>>>> testing1
```
Email:
admin@test.com

Password:
password
```
<<<<<<< HEAD
>>>>>>> origin/main
=======
>>>>>>> testing1
---

## Notes

<<<<<<< HEAD
<<<<<<< HEAD
- The application includes a React frontend and an Express backend.
- Backend APIs are consumed by the React frontend.
- Prisma configuration and an initial database schema are included.
- Some application data may still use in-memory storage during development and testing.
- GitHub Pages hosts the frontend only.
- Local development requires both the backend and frontend servers.
=======
=======
>>>>>>> testing1
- Data is stored in memory.
- Backend APIs are consumed by the React frontend.
- GitHub Pages hosts the frontend only.
- Local development requires both backend and frontend servers.
<<<<<<< HEAD
>>>>>>> origin/main
=======
>>>>>>> testing1

---

## Team

Developed as part of COSC Assignment 3 – QueueSmart Smart Queue Management System.
