const express = require("express");   //express library is called as function as require() returns function/loads library
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const OpenAI = require("openai");

dotenv.config();

const app = express(); //create server/app = entire backend application
app.use(express.json());  //JSON middleware
app.use(cors({
  origin: ["https://myinterq.vercel.app", "http://localhost:3000"],
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"],
}));

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
You are an expert AI system designed to create high-quality interview questions and answers.

Generate exactly 10 ${difficulty} level interview questions for the role of ${jobType}.

Candidate Experience: ${workExperience} years  
Focus Topic: ${topic}  
Company Type: ${companyType}

Rules:
- 4 Technical questions
- 3 Behavioral questions
- 3 Situational questions

Format strictly as:
1. Question
Answer: Full answer in 4–6 lines

Return ONLY the list. No intro. No explanation.
`;



    const chatResponse = await openai.chat.completions.create({
      model: "llama3-70b-8192", // Groq’s best model
      messages: [
        { role: "system", content: "You are an expert interview question generator." },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
    });

    const text = chatResponse.choices[0].message.content;
    console.log("Groq Response:\n", text);

    const qaBlocks = text.split(/\n(?=\d+\.\s)/);
    const qaList = [];

    qaBlocks.forEach(block => {
      const questionMatch = block.match(/\d+\.\s*(.+?)\n/);
      const answerMatch = block.match(/Answer:\s*([\s\S]*)/);
      if (questionMatch && answerMatch) {
        qaList.push({
          question: questionMatch[1].trim(),
          answer: answerMatch[1].trim(),
        });
      }
    });

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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on ${process.env.PORT}`);
}); 


// Node.js = Engine / Runtime

// Node.js is the platform that allows JavaScript to run outside the browser.
//Express.js = Framework built on Node.js

// Express is a web framework made using Node.js.
// Express handles “web stuff”
// Node handles “system stuff”