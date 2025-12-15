# 💰 SpendSense - AI-Powered Finance Tracker

**SpendSense** is a modern, mobile-first Progressive Web Application (PWA) designed for personal finance tracking. It features a unique "Neon Clay" dark mode aesthetic, robust budgeting tools, and an integrated **Gemini 3 Pro** AI financial assistant.

---

## 🚀 Quick Start (No-Build Architecture)

This project uses **ES Modules** directly via browser-native imports (`esm.sh`). There is **no build step** (no Webpack, Vite, or `npm install` required).

### Prerequisites
*   A modern web browser (Chrome 100+, Edge, Safari, Firefox).
*   A local static file server (e.g., VS Code "Live Server" extension, Python `http.server`, or `serve`).

### How to Run
1.  **Clone/Download** the repository.
2.  **API Key Setup**: Open `services/aiService.ts` and replace the placeholder with your Google Gemini API Key:
    ```typescript
    const API_KEY = "YOUR_GEMINI_API_KEY"; 
    ```
3.  **Serve**: Open the project folder in VS Code and click "Go Live" (Live Server).
    *   *Alternative*: Run `python3 -m http.server 8000` in the terminal.
4.  **Access**: Open `http://localhost:5500` (or your port) in the browser.

---

## 🏗️ Technical Architecture

### Tech Stack
*   **Frontend Library**: React 19 (via ESM)
*   **Language**: TypeScript (Transpiled on-the-fly or purely typed in dev)
*   **Styling**: Tailwind CSS (CDN) + Custom CSS Variables for "Claymorphism".
*   **AI Engine**: Google GenAI SDK (`@google/genai`) using model `gemini-3-pro-preview`.
*   **Persistence**: LocalStorage (Offline-first) + BroadcastChannel (Tab Sync).
*   **Backend (Optional)**: Firebase Auth & Firestore (Toggleable in `services/firebase.ts`).
*   **Charts**: Recharts.
*   **Icons**: Lucide React.

### Directory Structure
```text
/
├── index.html              # Entry point, Import Maps, Tailwind Config, CSS Vars
├── index.tsx               # React Root
├── App.tsx                 # Main Layout & Router Logic
├── types.ts                # TypeScript Interfaces (Data Models)
├── constants.ts            # Static Data (Currencies, Default Categories)
│
├── services/               # Business Logic Layer
│   ├── storageService.ts   # LocalStorage CRUD + Sync Logic
│   ├── aiService.ts        # Gemini AI Integration
│   ├── authService.ts      # Authentication (Mock + Firebase)
│   ├── notificationService.ts # Browser Notification Scheduler
│   └── firebase.ts         # Firebase Initialization
│
├── screens/                # View Components
│   ├── HomeScreen.tsx      # Dashboard & Transaction List
│   ├── AddTransactionScreen.tsx # Add/Edit Form
│   ├── AnalysisScreen.tsx  # Charts & Stats
│   ├── BudgetScreen.tsx    # Budget Management
│   ├── ProfileScreen.tsx   # Settings, Export, Theme
│   └── AuthScreen.tsx      # Login/Signup
│
├── components/             # Reusable UI
│   ├── BottomNav.tsx       # Navigation Bar
│   └── AiAssistant.tsx     # Floating Chatbot UI
│
└── utils/
    └── format.ts           # Currency Formatting Helpers
```

---

## 💾 Core Services & Logic

### 1. Storage Service (`services/storageService.ts`)
The app follows an **Offline-First** approach.
*   **Data Persistence**: All data (Transactions, Categories, Settings) is stored in the browser's `localStorage` as JSON strings.
*   **Tab Synchronization**: Uses the `BroadcastChannel` API.
    *   *Mechanism*: When a transaction is added in Tab A, a message is broadcasted. Tab B listens for this message and triggers a re-fetch of data, ensuring the UI is always in sync without page reloads.
*   **Backup/Restore**:
    *   `exportData()`: Dumps all state to a JSON file.
    *   `importData()`: Validates and overwrites local state from a JSON file.

### 2. AI Service (`services/aiService.ts`)
Integrates **Google Gemini 3 Pro** to act as a financial analyst.
*   **Context Window**: The service pulls the last **500 transactions** and the user's budget settings.
*   **System Instruction**: A dynamic system prompt is generated containing:
    *   User Name & Currency.
    *   Total Lifetime Spend.
    *   Minified JSON of recent transactions.
*   **Capabilities**: The AI can answer questions like *"How much did I spend on food last week?"* or *"Give me tips to save more."*

### 3. Notification Service (`services/notificationService.ts`)
A custom scheduler for Web Notifications.
*   **Daily Nudges**: Checks current time against user preference.
*   **Random Nudges**: If enabled, schedules 15 random `setTimeout` triggers to remind the user throughout the day.
*   **Critical Alerts**: Uses the `requireInteraction` flag to keep notifications persistent on screen.

### 4. Auth Service (`services/authService.ts`)
Implements a **Dual-Mode Authentication** system:
1.  **Mock Mode (Default)**: If Firebase is not configured, it simulates login/signup using LocalStorage tokens.
2.  **Firebase Mode**: If API keys are present in `services/firebase.ts`, it switches to real Firebase Auth (Email/Password).

---

## 📊 Data Models (`types.ts`)

### Transaction
The core unit of data.
```typescript
interface Transaction {
  id: string;
  amount: number;       // Always stored in BASE currency (INR)
  categoryId: string;
  categoryName: string;
  notes: string;
  date: string;         // ISO YYYY-MM-DD
  time: string;         // HH:mm
  type: 'EXPENSE' | 'INCOME';
  paymentMethod: 'Cash' | 'Card' | 'UPI';
}
```

### AppSettings
Controls the user experience.
```typescript
interface AppSettings {
  currencyCode: string; // e.g., 'USD'
  monthlyBudget: number;
  theme: 'dark' | 'light' | 'system';
  savingsGoal: number;
  notifications: NotificationPreferences;
}
```

---

## 🎨 UI/UX System

### Theme Engine
The app uses a custom Tailwind configuration injected via `index.html`.
*   **Claymorphism**: Achieved using `box-shadow` utilities (`shadow-clay-card`, `shadow-clay-inset`) to give elements a soft, 3D extruded look.
*   **Neon Dark Mode**: High contrast colors (`#b9fbc0` Primary, `#ff6b6b` Expense) against a deep grey background (`#232323`).

### Responsive Charts
Uses `recharts` for visualization.
*   **Pie Chart**: Shows spending distribution by category.
*   **Bar Chart**: Shows daily spending trends.
*   **Logic**: Charts automatically aggregate data based on the selected timeframe (Daily, Weekly, Monthly, Yearly).

---

## 🛠️ Customization

### Adding Currencies
1.  Open `constants.ts`.
2.  Add a new object to the `CURRENCIES` array:
    ```typescript
    { code: 'XYZ', symbol: 'X', rate: 0.5, name: 'My Currency' }
    ```
    *Note: `rate` is relative to INR (Indian Rupee) as the base.*

### Changing Categories
Modify `DEFAULT_CATEGORIES` in `constants.ts`. New users will see these defaults. Existing users can add Custom Categories via the UI.

---

## 🔮 Future Roadmap
1.  **Cloud Sync**: Fully implement Firestore syncing in `storageService.ts` to replace LocalStorage when logged in.
2.  **Receipt Scanning**: Use Gemini Vision capabilities to scan receipts and auto-fill the transaction form.
3.  **Voice Input**: Use the Web Speech API to add transactions via voice commands.
