import React, { useState, useEffect } from "react";
import axios from "axios";
import { RingLoader } from 'react-spinners';
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { FaSun, FaMoon, FaVolumeUp, FaStop } from 'react-icons/fa';
import './App.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

function App() {
  const [formData, setFormData] = useState({
    jobType: "",
    workExperience: "",
    topic: "",
    companyType: "",
    difficulty: "",
  });

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [speakingText, setSpeakingText] = useState(null);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');

  const getBestVoice = () => {
    const voices = window.speechSynthesis.getVoices();
    return voices.find(v => v.name.includes("Google US English") || (v.lang === "en-US" && v.name.includes("Natural"))) 
           || voices.find(v => v.lang === "en-US") 
           || voices[0];
  };

  const toggleSpeak = (text) => {
    const synth = window.speechSynthesis;
    if (!synth) return;
    if (speakingText === text) {
      synth.cancel();
      setSpeakingText(null);
      return;
    }
    synth.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.voice = getBestVoice();
    utter.rate = 0.95;
    utter.onend = () => setSpeakingText(null);
    synth.speak(utter);
    setSpeakingText(text);
  };

  useEffect(() => {
    window.speechSynthesis.getVoices();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "workExperience") {
      if (value !== "" && !/^\d*$/.test(value)) return;
    }
    if (["jobType", "topic", "companyType"].includes(name)) {
      if (value !== "" && !/^[a-zA-Z\s]*$/.test(value)) return;
    }
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.jobType || !formData.workExperience || !formData.topic || !formData.companyType || !formData.difficulty) {
      setError("Please fill in all fields.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/interview-questions`, formData);
      setQuestions(response.data.questions || []);
    } catch (err) {
      setError("Failed to generate questions. Please check your connection.");
    }
    setLoading(false);
  };

  const downloadPDF = async () => {
    const input = document.getElementById("pdf-content");
    
    // Create a style block for the PDF capture to fix spacing and margins
    const style = document.createElement('style');
    style.innerHTML = `
      #pdf-content { 
        padding: 40px !important; 
        width: 800px !important;
        letter-spacing: 0.2px !important;
        word-spacing: 2px !important;
      }
      .speak-btn { display: none !important; }
      .question-item { margin-bottom: 30px !important; page-break-inside: avoid !important; }
      .q-text, .a-text { line-height: 1.6 !important; }
    `;
    document.head.appendChild(style);

    try {
      const canvas = await html2canvas(input, { 
        scale: 2, 
        backgroundColor: theme === 'light' ? "#ffffff" : "#0d1117",
        useCORS: true,
        logging: false,
        onclone: (clonedDoc) => {
          // This runs on the cloned document used for the canvas
          const content = clonedDoc.getElementById('pdf-content');
          content.style.padding = '40px';
        }
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 210; 
      const pageHeight = 297; 
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save("InterQ_Interview_Prep.pdf");
    } finally {
      document.head.removeChild(style);
    }
  };

  const categories = ["TECHNICAL", "BEHAVIORAL", "SITUATIONAL"];

  return (
    <div className="app-container">
      <div className="main-card">
        <button onClick={toggleTheme} className="theme-toggle">
          {theme === 'light' ? <FaMoon /> : <FaSun />}
        </button>

        <header className="header">
          <h1>
            InterQ
            <span>AI-Powered Interview Preparation Engine</span>
          </h1>
        </header>

        <form onSubmit={handleSubmit} className="interview-form">
          <div className="input-group">
            <label>Job Type</label>
            <input name="jobType" type="text" placeholder="e.g. Node.js Developer" value={formData.jobType} onChange={handleChange} required />
          </div>

          <div className="input-group">
            <label>Work Experience (Years)</label>
            <input name="workExperience" type="text" inputMode="numeric" placeholder="e.g. 2" value={formData.workExperience} onChange={handleChange} required />
          </div>

          <div className="input-group">
            <label>Topic</label>
            <input name="topic" type="text" placeholder="e.g. Database Design" value={formData.topic} onChange={handleChange} required />
          </div>

          <div className="input-group">
            <label>Company Type</label>
            <input name="companyType" type="text" placeholder="e.g. MNC" value={formData.companyType} onChange={handleChange} required />
          </div>

          <div className="input-group">
            <label>Difficulty</label>
            <select name="difficulty" value={formData.difficulty} onChange={handleChange} required>
              <option value="">Select Difficulty</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>

          <button type="submit" disabled={loading} className="generate-btn">
            {loading ? <RingLoader size={20} color="#fff" /> : "Generate Questions"}
          </button>
        </form>

        {error && <p className="error-msg">{error}</p>}

        <div id="pdf-content">
          {categories.map(cat => {
            const filtered = questions.filter(q => q.category.toUpperCase() === cat);
            if (filtered.length === 0) return null;
            return (
              <div key={cat}>
                <h2 className="section-title">{cat}</h2>
                {filtered.map((qa, i) => (
                  <div key={i} className="question-item">
                    <div className="qa-row">
                      <div className="qa-text-content">
                        <p className="q-text">
                          <strong>Q:</strong> {qa.question}
                        </p>
                      </div>
                      <button 
                        onClick={() => toggleSpeak(qa.question)} 
                        className="speak-btn"
                        title="Click to hear the pronunciation"
                      >
                        {speakingText === qa.question ? <FaStop /> : <FaVolumeUp />}
                      </button>
                    </div>

                    <div className="qa-row mt-12">
                      <div className="qa-text-content">
                        <p className="a-text">
                          <strong>A:</strong> {qa.answer}
                        </p>
                      </div>
                      <button 
                        onClick={() => toggleSpeak(qa.answer)} 
                        className="speak-btn"
                        title="Click to hear the pronunciation"
                      >
                        {speakingText === qa.answer ? <FaStop /> : <FaVolumeUp />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>

        {questions.length > 0 && (
          <button onClick={downloadPDF} className="download-btn">Download as PDF</button>
        )}
      </div>
    </div>
  );
}

export default App;
