# 🛒 Zikishop — Cross-Border Collaborative Grocery Engine

**Zikishop** is a full-stack, real-time collaborative grocery shopping application designed for cross-border families between **South Africa (SA)** and **Zimbabwe (ZIM)**. It enables diaspora family members (e.g. in Johannesburg or London) to shop together in real time with relatives back home (e.g. in Harare or Bulawayo) via live video call, shared synchronized cart, multi-currency split payment calculations, and Gemini AI-powered voice & basket recommendations.

---

## 🚀 Key Features & Highlights

- **🎥 Live Video Call Shopping View**:
  - Interactive video call interface built with real-time peer layout algorithms.
  - Dynamically resizes participant frames as members join or leave.
  - Features dynamic **AI Product Suggestions** positioned directly below the video canvas.
  - Full-width **Live Split Shares Breakdown** showing each family member's share in USD, ZAR, and ZWG.

- **🤖 Gemini 3.6 Flash AI Integration**:
  - **Voice AI Assistant**: Interactive voice/text modal for hands-free shopping additions and voice command navigation.
  - **Smart Basket AI**: Generates personalized, budget-conscious family grocery bundles using structured JSON generation (`responseSchema`).
  - **Recipe AI Engine**: Translates traditional meals (e.g., *Sadza ne Beef Stew*) into exact store catalog ingredient picks.
  - **Ziki AI Assistant**: Loyalty, smart replenishment tips, and automated meal planning recommendations.

- **⚡ Real-Time WebSockets (Socket.io)**:
  - Instant cross-border cart updates across connected family members.
  - Live activity notifications, member join/leave broadcasts, and order dispatch events.

- **💱 Cross-Border Multi-Currency Split Engine**:
  - Supports triple currency tracking: **USD ($)**, **ZAR (R)**, and **ZWG (ZiG)**.
  - Flexible split options: **By Request (Per Submitter)**, **Split Equally**, or **Custom Ratio Split**.

- **💬 WhatsApp API Simulator & Fallback**:
  - Simulates WhatsApp message interaction for low-data network scenarios in Zimbabwe.
  - Allows placing orders and querying basket totals directly via simulated WhatsApp triggers.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, Motion animations.
- **Backend**: Node.js, Express, Socket.io, `@google/genai` (Gemini SDK), `tsx`, `esbuild`.
- **API Engine**: REST API endpoints for Cart management, AI Recommendations, Recipe Matching, and Split Calculation.

---

## 📡 API Endpoints Reference

### 🛒 Cart & Family Management
- `GET /api/cart` — Fetch active shared cart, connected family members, and current exchange rates.
- `POST /api/cart/add` — Add an item to the shared family cart with member attribution.
- `POST /api/cart/update` — Update item quantity or remove items.
- `POST /api/cart/clear` — Reset the active shared cart.
- `GET /api/members` — Fetch registered family members and their locations.

### 🧮 Split Shares & Checkout
- `POST /api/cart/split-calculator` — Calculates real-time breakdown per family member based on chosen split strategy (`EQUAL`, `BY_SUBMITTER`, `CUSTOM`).
- `POST /api/checkout` — Processes payment, generates order receipt voucher codes, and broadcasts order creation.

### 🤖 Gemini AI Endpoints
- `POST /api/smart-basket/recommendations` — Generates AI staple basket based on budget, family size, and location.
- `POST /api/ai/recipe-suggest` — Analyzes meal query and returns matching catalog items for traditional dishes.

### 💬 WhatsApp Integration
- `POST /api/whatsapp/receive` — Receives simulated inbound WhatsApp messages and auto-parses commands.
- `GET /api/whatsapp/logs` — Retrieves history of WhatsApp interaction logs.

---

## 📦 Getting Started

### Prerequisites
- **Node.js**: v18 or higher
- **npm**: v9 or higher

### Environment Setup
1. Copy the example environment configuration:
   ```bash
   cp .env.example .env
   ```
2. Set your **Gemini API Key** in `.env`:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

### Installation
```bash
npm install
```

### Running Development Server
Starts the Express backend server with Vite middleware on port 3000:
```bash
npm run dev
```

### Production Build
Bundles the React client with Vite and compiles the backend TypeScript server into a self-contained CommonJS file (`dist/server.cjs`) using `esbuild`:
```bash
npm run build
npm start
```

---

## 📂 Project Structure

```
├── server.ts                    # Main Express + Socket.io + Gemini API server
├── src/
│   ├── App.tsx                  # Primary React application wrapper
│   ├── components/              # Modular UI Components
│   │   ├── LiveCallShoppingView.tsx # Video call shopping layout & split shares
│   │   ├── FamilyCart.tsx       # Shared family cart view & multi-currency engine
│   │   ├── SmartBasketModal.tsx # AI Smart Basket generator modal
│   │   ├── VoiceAIAssistant.tsx # Voice Assistant modal using Gemini
│   │   ├── WhatsAppSimulator.tsx# Low-data WhatsApp channel simulator
│   │   ├── ProfileView.tsx      # User profile, wallet, and Ziki loyalty points
│   │   └── ...
│   ├── data/
│   │   └── products.ts          # Catalog products database
│   ├── types.ts                 # Shared TypeScript interfaces & enums
│   └── utils/
│       └── currency.ts          # Currency conversion helpers
├── .env.example                 # Environment variables declaration template
└── package.json                 # Project dependencies and build scripts
```

---

## 📄 License

Distributed under the MIT License.
