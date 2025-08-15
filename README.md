# Tally - Personal Net Worth Tracker

A beautiful, secure, and feature-rich personal net worth tracking application built with React, TypeScript, and Firebase.

## ✨ Features

-   **🔐 Secure Google Authentication** - Sign in safely with your Google account
-   **💰 Asset Management** - Track all your assets (cash, investments, real estate, etc.)
-   **💳 Debt Tracking** - Monitor debts with interest rates and minimum payments
-   **📊 Net Worth Visualization** - Beautiful charts showing your financial progress over time
-   **🌙 Dark Theme** - Sleek, modern dark UI with smooth animations
-   **⚡ Rate Limiting** - Built-in security to prevent abuse
-   **📱 Responsive Design** - Works perfectly on desktop and mobile
-   **🎨 Smooth Animations** - Polished user experience with Framer Motion

## 🚀 Quick Start

1. **Set up Firebase** (see `FIREBASE_SETUP.md` for detailed instructions)
2. **Install dependencies**:
    ```bash
    npm install
    ```
3. **Start the development server**:
    ```bash
    npm run dev
    ```

## 🛠️ Tech Stack

-   **Frontend**: React 18 + TypeScript + Vite
-   **Authentication**: Firebase Auth with Google OAuth
-   **Database**: Cloud Firestore
-   **Styling**: CSS Custom Properties + Modern CSS
-   **Animations**: Framer Motion
-   **Charts**: Recharts
-   **Icons**: Lucide React
-   **Notifications**: React Hot Toast
-   **Date Handling**: date-fns

## 🔒 Security Features

-   **Google OAuth** - Secure authentication without storing passwords
-   **Rate Limiting** - Prevents API abuse with client-side rate limiting
-   **Data Isolation** - Users can only access their own financial data
-   **Firestore Security Rules** - Server-side data protection
-   **Input Validation** - All user inputs are validated and sanitized

## 📖 Usage

1. **Sign In** - Use your Google account to authenticate
2. **Add Assets** - Include savings, investments, real estate, vehicles, etc.
3. **Track Debts** - Add credit cards, loans, mortgages with details
4. **Monitor Progress** - Watch your net worth change over time with interactive charts
5. **Edit & Delete** - Easily update or remove items as your finances change

## 🏗️ Project Structure

```
src/
├── components/          # React components
│   ├── Login.tsx       # Authentication page
│   ├── Dashboard.tsx   # Main dashboard
│   ├── AssetForm.tsx   # Add/edit assets
│   ├── DebtForm.tsx    # Add/edit debts
│   ├── AssetList.tsx   # Display assets
│   ├── DebtList.tsx    # Display debts
│   ├── Header.tsx      # Navigation
│   └── NetWorthChart.tsx # Data visualization
├── contexts/           # React contexts
│   └── AuthContext.tsx # Authentication state
├── hooks/              # Custom hooks
│   └── useRateLimit.ts # Rate limiting logic
├── lib/                # Utilities
│   └── firebase.ts     # Firebase configuration
├── services/           # Business logic
│   └── netWorthService.ts # Net worth calculations
└── types/              # TypeScript definitions
    └── index.ts        # Type definitions
```

## 🎨 Design Philosophy

-   **Dark Theme Only** - Optimized for reduced eye strain and modern aesthetics
-   **Minimal & Clean** - Focus on content with minimal distractions
-   **Smooth Animations** - Enhance UX without being overwhelming
-   **Responsive** - Works seamlessly across all device sizes
-   **Accessible** - Proper contrast ratios and keyboard navigation

## 🚀 Deployment

The app can be deployed to any static hosting service:

-   **Vercel** (Recommended)
-   **Netlify**
-   **Firebase Hosting**
-   **GitHub Pages**

Make sure to:

1. Set up environment variables for Firebase config
2. Add your production domain to Firebase Authentication settings
3. Update Firestore security rules for production

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

---

**Built with ❤️ for better financial awareness and planning.**
