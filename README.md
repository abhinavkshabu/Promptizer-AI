# ⚡ Promptizer 

An elite Chrome Extension that acts as your personal AI concierge. Promptizer transforms basic, lazy text into master-crafted, highly-detailed AI prompts with a single click. 

Designed with a sleek, "Minimal Luxury" UI, it injects seamlessly into ChatGPT, Claude, and Gemini. Powered by a custom Node.js backend and Groq's lightning-fast LPU inference engine, it uses advanced Chain-of-Thought (CoT) reasoning to structure the perfect context and constraints for maximum AI performance.

---

## ✨ Features
* **1-Click Magic:** Works directly inside the input boxes of major AI platforms.
* **Contextual Intelligence:** The backend analyzes your intent before writing, generating elite-level prompts automatically.
* **Ultra-Fast Inference:** Powered by Groq for near-zero latency text generation.
* **Premium UI:** Features an animated, cyber-minimalist SVG loading skeleton and an interactive "Galaxy Button" for seamless prompt insertion.

---

## 🛠️ Prerequisites
Before you begin, ensure you have the following installed on your computer:
* **[Node.js](https://nodejs.org/)** (v18 or higher recommended)
* **Google Chrome** (or any Chromium-based browser)
* A free **[Groq API Key](https://console.groq.com/keys)**

---

## 🚀 How to Run Locally

### Step 1: Clone the Repository
Open your terminal and clone this repository to your local machine:
```bash
git clone [https://github.com/abhinavkshabu/Promptizer-AI.git](https://github.com/abhinavkshabu/Promptizer-AI.git)
cd Promptizer-AI
Step 2: Setup the Backend Server
The extension relies on a Node.js backend to securely communicate with the Groq API.

Install the required server dependencies:

Bash
npm install
In the root directory, create a hidden file named exactly .env.

Open the .env file and paste your Groq API key inside it like this:

Code snippet
GROQ_API_KEY=gsk_your_api_key_here
(Note: Never upload this .env file to GitHub!)

Start the local server:

Bash
npm start
Step 3: Configure the Extension
By default, the extension points to the live cloud server. To run it locally, tell the extension to talk to your local computer.

Open background.js in your code editor.

Find the fetch() URL and change it to your local server:

JavaScript
fetch('[http://127.0.0.1:3000/api/optimize](http://127.0.0.1:3000/api/optimize)', { ... })
Save the file.

Step 4: Install the Extension in Chrome
Open Google Chrome and type chrome://extensions/ in the URL bar.

In the top right corner, toggle Developer mode to ON.

Click the Load unpacked button in the top left.

Select the main Promptizer-AI folder (the one containing manifest.json).

Pin the extension to your Chrome toolbar for easy access.

💡 Usage
Make sure your local Node.js server (or Render server) is running.

Open Gemini, ChatGPT, or Claude.

Type a lazy or basic prompt into the chat box.

Click the ⚡ Promptize button that appears below the chat box.

Watch the animated UI process your request, and click Insert Prompt to drop the elite prompt into your chat!

🔒 Privacy & Architecture
Frontend: Standard Manifest V3 Chrome Extension architecture (content.js, background.js).

Backend: Express.js REST API hosted on Render. Kept separate to ensure API keys are never exposed to the client-side browser.

Data: Prompts are processed temporarily in memory. No user data or chat logs are permanently stored on the server.

Engineered by Abhinav Shabu
