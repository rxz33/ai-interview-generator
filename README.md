AI Interview Question Generator - InterQ

InterQ is a professional, AI-driven interview preparation engine that generates relevant, role-specific questions and expert-level answers using Groq AI. Designed with a clean and minimal interface, it provides a seamless user experience for serious job seekers.

Tech Stack
- **Frontend**: React, Clean CSS, Lucide Icons
- **Backend**: Node.js, Express.js
- **AI**: Groq (Llama 3.1 8B)
- **Database**: MongoDB
- **PDF**: html2canvas & jsPDF

Key Features
- **Fast AI**: Role-specific question sets in seconds.
- **Clean UI**: Modern minimal design with light and dark mode support.
- **Voice Prep**: Text-to-speech integration for verbal practice.
- **Expert Reports**: Download your practice sets as high-quality PDFs.
- **Deep Customization**: Filter by job role, experience, company type, and difficulty.

---

## Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/rxz33/ai-interview-generator.git
cd ai-interview-generator
```

### 2. Install Dependencies
Install dependencies for both the backend and the frontend:
```bash
# Install root dependencies
npm install

# Install client dependencies
cd client && npm install && cd ..
```

### 3. Environment Setup
Create a `.env` file in the root directory and add your credentials:
```env
MONGODB_URI=your_mongodb_connection_string
GROQ_API_KEY=your_groq_api_key
PORT=5000
```

### 4. Run the Application

#### Development Mode (Run both Server & Client)
```bash
npm run dev
```
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

#### Production Mode
Build the frontend and start the server:
```bash
npm run build
npm start
```

---

## About the Creator
Made by Rashi
GitHub @rxz33
