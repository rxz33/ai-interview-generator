const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const OpenAI = require("openai");
const path = require("path");

dotenv.config();

const app = express(); 
app.use(express.json());
app.use(cors());

const mongoURI = process.env.MONGODB_URI;
if (!mongoURI) {
  console.error("MONGODB_URI not found in .env. Please set it before running the server.");
  process.exit(1);
}

mongoose.connect(mongoURI)
  .then(() => console.log("Connected to MongoDB"))
  .catch(err => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

// Interview Schema
const interviewSchema = new mongoose.Schema({
  jobType: String,
  workExperience: String,
  companyType: String,
  topic: String,
  difficulty: String,
  questions: [{ question: String, answer: String }],
  createdAt: { type: Date, default: Date.now }
});
const Interview = mongoose.model("Interview", interviewSchema);

// GroqAI Setup
const groqApiKey = process.env.GROQ_API_KEY;
if (!groqApiKey) {
  console.error("❌ GROQ_API_KEY not found in .env. Please set it before running the server.");
  process.exit(1);
}

const openai = new OpenAI({
  apiKey: groqApiKey,
  baseURL: "https://api.groq.com/openai/v1", // Important for Groq
});

// Health Route
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});


// Main Interview Route
app.post("/api/interview-questions", async (req, res) => {
  try {
    const { jobType, workExperience, companyType, topic, difficulty } = req.body;

const prompt = `
Generate exactly 10 interview questions for the role of ${jobType} at a ${difficulty} level.
Experience: ${workExperience} years. Topic: ${topic}. Company: ${companyType}.

Structure the response into exactly three sections:
### TECHNICAL
(4 questions)
### BEHAVIORAL
(3 questions)
### SITUATIONAL
(3 questions)

Format each question as:
Q: [Question]
A: [Answer]
`;

  const MODEL = "llama-3.1-8b-instant";

  const chatResponse = await openai.chat.completions.create({
  model: MODEL,
  messages: [
    { role: "system", content: "You are a professional recruiter. Provide only the questions and answers in the requested format." },
    { role: "user", content: prompt },
  ],
  temperature: 0.6,
});

    const text = chatResponse.choices[0].message.content;
    console.log("Groq Response:\n", text);

    const qaList = [];
    let currentCategory = "General";
    
    const lines = text.split('\n');
    let currentQA = null;

    lines.forEach(line => {
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith("###")) {
        currentCategory = trimmedLine.replace(/###/g, "").trim();
      } else if (trimmedLine.startsWith("Q:")) {
        if (currentQA) qaList.push(currentQA);
        currentQA = { category: currentCategory, question: trimmedLine.substring(2).trim(), answer: "" };
      } else if (trimmedLine.startsWith("A:") && currentQA) {
        currentQA.answer = trimmedLine.substring(2).trim();
      } else if (currentQA && trimmedLine && !trimmedLine.startsWith("###")) {
        currentQA.answer += " " + trimmedLine;
      }
    });
    if (currentQA) qaList.push(currentQA);

    if (qaList.length === 0) {
      console.error("Failed to parse questions properly.");
      return res.status(500).json({ error: "Failed to parse Groq response properly." });
    }

    try {
      const newEntry = new Interview({
        jobType,
        workExperience,
        companyType,
        topic,
        difficulty,
        questions: qaList,
      });
      await newEntry.save();
      console.log("Questions saved to MongoDB.");
    } catch (err) {
      console.error("MongoDB Save Error:", err);
      return res.status(500).json({ error: "Failed to save interview questions" });
    }

    res.json({ questions: qaList });

  } catch (error) {
    console.error("Unexpected Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Serve static files from the React app
app.use(express.static(path.join(__dirname, "client/build")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "client/build", "index.html"));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 


// Node.js = Engine / Runtime

// Node.js is the platform that allows JavaScript to run outside the browser.
//Express.js = Framework built on Node.js

// Express is a web framework made using Node.js.
// Express handles “web stuff”
// Node handles “system stuff”