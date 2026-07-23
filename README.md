<div align="center">

# QChat

<img src="assets/QChat.png" width="125" />

**An anonymous real-time chat and matching platform designed for spontaneous conversations.**

<br />

[![Expo](https://img.shields.io/badge/Expo-4630EB?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev/)
[![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactnative.dev/)
[![Firebase](https://img.shields.io/badge/firebase-ffca28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)

<br />

QChat is a modern, feature-rich, and user-friendly anonymous chat platform that connects people through random matching. Built with React Native and Expo, this application offers real-time messaging, international/local mode selection, reputation system, and seamless user experience.

---

## ✨ Core Features

**Anonymous Matching:** Connect with random users instantly based on your preferences.

**Local & International Modes:** Choose to chat with people nearby or from around the world.

**Real-Time Messaging:** Instant messaging powered by Firebase Firestore.

**Reputation System:** Dynamic reputation scoring to encourage positive interactions.

**Rematch Feature:** Reconnect with recent chat partners with mutual consent.

**Multi-Language Support:** Full Turkish and English language support.

**Report System:** In-app reporting for spam, harassment, and inappropriate content.

---

## 🛠️ Technology Stack

**Frontend:** React Native, Expo

**State Management:** Zustand

**Backend & Database:** Firebase (Firestore, Auth)

**Styling:** React Native StyleSheet (Dark Corporate Theme)

**Navigation:** React Navigation

---

## 🚀 Getting Started

Follow these steps to run the project in your local environment:

<div align="left">

```bash
# Clone the repository
git clone https://github.com/furkanusakpinar/QChat-Anonymous-Real-Time-Chat-Matching-Mobile-Application.git

# Navigate to project folder
cd QChat

# Install dependencies
npm install

# (Optional) Configure Firebase - copy and fill in your credentials
cp .env.example .env
# Or configure from inside the app via Profile > Firebase Setup

# Start the application
npx expo start
```

---

## 🔧 Firebase Setup

This app requires a Firebase project to function. You have two options:

**Option 1 - In-App Setup (Recommended):**
1. Create a Firebase project at [firebase.google.com](https://firebase.google.com)
2. Enable Firestore Database and Authentication
3. Go to Project Settings > Web App and copy the config JSON
4. Launch the app and go to Profile > Firebase Setup
5. Paste the config JSON and save

**Option 2 - Environment File:**
1. Copy `.env.example` to `.env`
2. Fill in your Firebase project credentials
3. The app will read from `.env` on startup

</div>
