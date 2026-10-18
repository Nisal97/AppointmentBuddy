# 📅 Appointment Buddy

Appointment Buddy is a lightweight, real-time appointment and queue management system tailored for local service providers like barbershops, salons, and private family doctors. Built as a Progressive Web App (PWA), it delivers a seamless, native-like experience across desktop reception terminals and mobile devices.

## ✨ Core Features

*   **Cross-Device PWA:** Installable directly from the browser to PC or mobile devices with persistent login sessions.
*   **Real-Time Queue Tracking:** Instantly move appointments through status stages (Upcoming ➔ Ongoing ➔ Completed) with real-time UI updates across all logged-in devices.
*   **Smart Entry Generation:** Customizable service menus with predefined time estimates and pricing to automatically calculate appointment blocks.
*   **Automated Reminders:** Scheduled WhatsApp notifications sent to customers exactly 10 minutes before their appointment time.
*   **Advanced Filtering & Search:** Easily locate past or upcoming records by date, time, customer name, phone number, or service type.
*   **Staff & Profile Management:** Secure credential management, password recovery, and multi-staff assignment capabilities.

## 🛠️ Tech Stack

*   **Frontend:** [Next.js](https://nextjs.org/) (React) configured as a Progressive Web App (PWA)
*   **Backend & Auth:** [Supabase](https://supabase.com/) (PostgreSQL, Real-time Subscriptions, Authentication)
*   **State Management:** [Zustand](https://github.com/pmndrs/zustand)
*   **Notifications:** Node.js Cron Jobs + Meta WhatsApp API (or local SMS gateway)
*   **Styling:** Tailwind CSS

## 🚀 Getting Started

### Prerequisites
*   Node.js (v18 or higher)
*   npm or yarn
*   A Supabase account and project

### Installation

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/yourusername/appointment-buddy.git](https://github.com/yourusername/appointment-buddy.git)
    cd appointment-buddy
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Environment Variables:**
    Create a `.env.local` file in the root directory and add your Supabase credentials:
    ```env
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```

4.  **Run the development server:**
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 🗄️ Database Schema (Upcoming)
*   `profiles`: Barber/Doctor details and settings.
*   `services`: Available services, estimated times, and prices.
*   `appointments`: Customer details, linked service, assigned staff, scheduled time, and current status.