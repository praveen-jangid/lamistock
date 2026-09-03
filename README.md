# LamiStock - Factory Lamination Panel Stock & Smart Cut-Order Matcher

**LamiStock** is a web and mobile-ready (Capacitor Android) surplus inventory manager and 2D cut optimization engine designed for wood and lamination factories.

---

## 🌟 Key Features

- **Surplus Stock Tracking**: Record surplus and offcut laminated panels with dimensions (Length × Width × Thickness in Inches), quantity, wood material, and optional front/back face photos.
- **Smart Cut-Order Matcher & 2D Optimizer**:
  - Automatically matches incoming furniture orders to existing surplus panels.
  - Generates 2D cutting diagrams with kerf waste allowances, multiple yield calculation, and offcut remnants.
  - Allows one-click stock deduction once cuts are approved for production.
- **Real-Time Cloud Firestore Sync**:
  - Full real-time synchronization between Mac desktop and Android factory floor devices.
  - Automatic offline persistence powered by Dexie (IndexedDB) with instant background sync to Cloud Firestore collection `lamination_panels`.
  - Photo uploads stored directly in Firebase Storage.
- **Instant Spec Sheet & WhatsApp Sharing**:
  - Generate formatted technical spec sheets with front and back face photos.
  - One-click share via WhatsApp to factory floor managers.

---

## 🚀 Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Vanilla CSS design system (responsive, glassmorphism, mobile-friendly)
- **Local Persistence**: Dexie.js (IndexedDB)
- **Cloud Backend**: Google Firebase (Cloud Firestore & Firebase Storage)
- **Mobile Runtime**: Capacitor Android

---

## 🛠️ Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Locally
```bash
npm run dev
```

### 3. Build for Production
```bash
npm run build
```

---

## ☁️ Cloud Firestore Setup

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com/).
2. Enable **Cloud Firestore** and **Firebase Storage**.
3. Apply the security rules defined in [`firestore.rules`](./firestore.rules) and [`storage.rules`](./storage.rules).
4. Click **Connect Cloud** in the app header and paste your Firebase Web App configuration. Use the built-in **Test Database** button to verify the connection.
