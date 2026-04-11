# 🎓 CampusConnect - Modern Learning Platform

A complete full-stack learning management system built with Next.js, featuring course enrollment, assignments, real-time chat, and an admin dashboard.

## ✨ Features

### 👨‍🎓 Student Features
- **Authentication** - Register, login, and secure session management
- **Course Management** - Browse courses, enroll, drop, and track progress
- **Assignments** - Submit assignments with text or file uploads (PDF, DOC, images)
- **Grades** - View grades and feedback from instructors
- **Real-time Chat** - Message other students with instant delivery
- **Notifications** - In-app notifications for enrollment, grades, and announcements
- **User Profile** - Manage personal information and settings
- **Course Reviews** - Rate and review completed courses (1-5 stars)

### 👑 Admin Features
- **Admin Dashboard** - Overview with stats cards
- **User Management** - View all users, change roles (Student/Admin), delete users
- **Course Management** - Add new courses, view all courses, delete courses
- **Assignment Grading** - Grade submissions, add feedback, view graded work
- **Broadcast Messages** - Send announcements to ALL students instantly

### 💬 Chat System
- Real-time messaging with Socket.io
- Online/offline status indicators
- Private 1-on-1 conversations
- Admin broadcast announcements to all users
- Message history persistence

##  Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 14, React 18, Tailwind CSS |
| **Backend** | Next.js API Routes |
| **Authentication** | NextAuth.js (Credentials Provider) |
| **Database** | SQLite with Prisma ORM |
| **Real-time** | Socket.io |
| **File Uploads** | Multer |
| **Icons** | Lucide React |
| **Animations** | Framer Motion |

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/campusconnect.git
cd campusconnect