# QueueSmart – Smart Queue Management System

QueueSmart is a full-stack queue management application created for the COSC 4353 Software Design course.

The application allows users to join service queues, leave queues, view their current queue status, and receive estimated waiting information. Administrators can manage services, view queue entries, and serve the next customer.

---

## Project Information

- Course: COSC 4353 – Software Design
- Group: Group 20
- Project: QueueSmart
- Type: Full-stack web application

### Team Members

- Andy L. Do
- Ayush Kharel
- Ngoc Thang Nguyen
- Tom Hoang

---

## Main Features

### User Features

- Create an account
- Sign in to an existing account
- View the user dashboard
- Browse available services
- Join a service queue
- Leave a queue
- Check current queue status
- View estimated waiting time
- View queue position
- View queue history
- Receive queue notifications

### Administrator Features

- View the admin dashboard
- Create and manage services
- View customers in a queue
- Serve the next customer
- Manage queue entries
- Review queue activity
- Monitor service status

---

## Technology Stack

### Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- React Router
- React Icons

### Backend

- Node.js
- Express
- TypeScript
- REST API
- Middleware-based error handling
- Request validation
- Authentication and authorization

### Development Tools

- Git
- GitHub
- Visual Studio Code
- npm
- Postman
- Vitest

---

## Project Structure

```text
QueueSmart-main/
├── backend/
│   ├── src/
│   │   ├── middleware/
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   ├── history/
│   │   │   ├── notifications/
│   │   │   ├── queues/
│   │   │   └── services/
│   │   ├── store/
│   │   ├── validation/
│   │   ├── app.ts
│   │   ├── errors.ts
│   │   └── index.ts
│   ├── tests/
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── api/
│   │   ├── assets/
│   │   ├── components/
│   │   │   └── auth/
│   │   ├── context/
│   │   ├── data/
│   │   ├── layouts/
│   │   ├── pages/
│   │   │   ├── admin/
│   │   │   ├── auth/
│   │   │   └── user/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   ├── styles.css
│   │   └── types.ts
│   ├── package.json
│   └── vite.config.ts
│
└── README.md
```
