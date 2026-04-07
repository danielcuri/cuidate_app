# 📱 Project Name

Mobile application built with **Expo (React Native)** as part of a migration from an existing **Ionic 5 project**.  
The goal is to modernize the mobile experience, improve performance, and enable scalable future integrations.

---

## 🚀 Tech Stack

- Expo (React Native)
- TypeScript / JavaScript
- EAS (Expo Application Services)
- Node.js
- npm

---

## 📦 Installation

### 1. Clone the repository

git clone https://github.com/your-username/your-repo.git
cd your-repo

### 2. Install dependencies

npm install

### 3. Setup environment variables

Copy the example environment file and configure it:

cp .env.example .env

Then update the `.env` file with your local configuration values.

---

### 4. Install Expo CLI (if not installed)

npm install -g expo-cli

---

## ▶️ Running the Project (Development)

### Option 1: Run with Expo Go (USB - Physical Device)

This is the fastest way for local development.

#### Steps:

1. Install **Expo Go** on your phone:
    - Android: Play Store
    - iOS: App Store

2. Connect your phone via **USB cable**

3. Enable:
    - USB Debugging (Android)
    - Trust device (iOS)

4. Start the project:
   npx expo start

5. Run on device:
   npx expo start --android

# or

npx expo start --ios

👉 This will open the app directly on your connected device using Expo Go.

---

### Option 2: Run with Expo Go (QR - Wireless)

npx expo start

- Scan the QR code with Expo Go
- Make sure both devices are on the same network

---

## 📲 Running with EAS (Build for Physical Device)

EAS is used to generate installable builds (APK / IPA).

---

### 1. Install EAS CLI

npm install -g eas-cli

---

### 2. Login to Expo

eas login

---

### 3. Configure EAS (first time only if not had permission)

eas build:configure

---

### 4. Build the app

#### Android

eas build --platform android

#### iOS

eas build --platform ios

---

### 5. Install on device

- After build completes, Expo will provide a download link
- Download the APK (Android) or install via TestFlight (iOS)

---

## 🧪 Running EAS Build Locally (Optional)

eas build --platform android --local

---

## 📁 Project Structure (Example)

/src
/components
/screens
/services
/hooks
/assets
/app.json
/package.json
.env
.env.example

---

## 🔄 Migration Context

This project is part of a **migration from Ionic 5 to Expo (React Native)**, aiming to:

- Improve performance
- Enhance native capabilities
- Simplify maintenance and scalability
- Provide better user experience

---

## ⚠️ Notes

- Ensure you have Node.js >= 18
- Never commit your `.env` file
- Use a stable USB connection for device testing
- If Expo Go fails via USB, try:
  npx expo start --tunnel

---

## 👨‍💻 Author

Developed as part of a modernization initiative for mobile applications.
