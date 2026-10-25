# 🚗 DriveX — Car Rental Management System

A full-stack car rental platform designed to simplify vehicle discovery, rental bookings, payment workflows, customer reviews, and fleet management through a modern web interface.

## ✨ Features

### Customer Experience
- Browse available rental cars and view detailed vehicle information.
- Explore car categories and rental branches.
- Create and manage rental bookings.
- Follow the booking payment flow.
- Rate completed rentals and submit customer reviews.
- Explore car recommendations.

### Administration
- Admin dashboard for managing the rental system.
- Manage cars, categories, and branches.
- View and manage customer bookings.
- Manage users, payments, and customer reviews.
- Track rental availability and booking status.

### Technical Highlights
- Frontend and backend communicate through a REST API.
- Laravel backend with MySQL database integration.
- Authentication for protected operations.
- Reusable UI components and responsive page layouts.

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| Frontend | Next.js, React, TypeScript, Tailwind CSS |
| Backend | PHP, Laravel |
| Database | MySQL |
| API | REST API |
| Development Tools | Git, GitHub, Postman, XAMPP |

## 📸 Screenshots

### Home Page
![DriveX Home Page](screenshots/home-page.png)

### Cars Listing
![DriveX Cars Page](screenshots/car-page.png)

### Car Details
![DriveX Car Details](screenshots/car-details.png)

### Booking
![DriveX Booking Page](screenshots/booking-details-page.png)

### Admin Dashboard
![DriveX Admin Dashboard](screenshots/admin-dashboard.png)

> Make sure the screenshot filenames above match the actual files in the `screenshots/` directory.

## 📁 Project Structure

```text
car-rental-system/
├── backend/
│   ├── app/
│   ├── config/
│   ├── database/
│   ├── routes/
│   └── ...
├── frontend/
│   ├── app/
│   │   ├── admin/
│   │   ├── bookings/
│   │   ├── cars/
│   │   ├── payment/
│   │   ├── recommendations/
│   │   └── reviews/
│   └── ...
├── screenshots/
└── README.md
```

## ⚙️ Getting Started

### Prerequisites

Install the following before running the project:

- PHP and Composer
- Node.js and npm
- MySQL
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/Youssef-ibrahim200038542/car-rental-system.git
cd car-rental-system
```

### 2. Configure the Backend

```bash
cd backend
composer install
```

Create your local environment file from the example:

```bash
cp .env.example .env
```

On Windows PowerShell, you can use:

```powershell
Copy-Item .env.example .env
```

Configure your database connection in `backend/.env`, then run:

```bash
php artisan key:generate
php artisan migrate
php artisan serve
```

The Laravel development server normally runs at:

```text
http://127.0.0.1:8000
```

If the project requires existing seed data, storage setup, or additional migrations, follow the project's actual database setup requirements before running it.

### 3. Configure the Frontend

Open a new terminal at the project root:

```bash
cd frontend
npm install
```

Create `frontend/.env.local` and configure the backend API URL:

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api
```

Start the frontend:

```bash
npm run dev
```

Open the local frontend URL shown in the terminal, usually:

```text
http://localhost:3000
```

## 🔐 Environment Configuration

- Keep backend credentials in `backend/.env`.
- Keep local frontend environment settings in `frontend/.env.local`.
- Never commit real passwords, API keys, tokens, or other secrets.
- Use example environment files to document required variable names without exposing secret values.

## 👨‍💻 Developer

**Youssef Ibrahim**

Computer Science Student — AI Specialization  
Modern web development | React | PHP | Laravel | MySQL

## 📄 License

This project was developed for educational and portfolio purposes.
