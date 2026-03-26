# TaskFlow

TaskFlow is a productivity web application built with **React + Firebase** that helps users manage tasks efficiently while offering secure authentication via **Google Sign‑In**.

---

## 🚀 Features
- 🔐 **Authentication**: Google Sign‑In powered by Firebase Authentication
- 📂 **Database**: Firestore for real‑time task storage
- 🎨 **UI/UX**: Responsive design with modern components
- ☁️ **Deployment**: Ready for hosting on Vercel
- ⚡ **Performance**: Optimized builds and clean configuration

---

## 🛠️ Tech Stack
- **Frontend**: React, TypeScript
- **Backend/Services**: Firebase Authentication, Firestore
- **Deployment**: Vercel
- **Version Control**: Git + GitHub

---

## 📦 Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/sahilburele14/TaskFlow.git
cd TaskFlow
npm install

▶️ Running Locally
Start the development server:

bash
npm run dev
Open http://localhost:3000 (localhost in Bing) in your browser.

🔑 Firebase Setup
Register a Web App in Firebase Console under your project (taskflow-a1947).

Copy the config values into firebase-applet-config.json:

json
{
  "projectId": "taskflow-a1947",
  "appId": "YOUR_APP_ID",
  "apiKey": "YOUR_API_KEY",
  "authDomain": "taskflow-a1947.firebaseapp.com",
  "storageBucket": "taskflow-a1947.appspot.com",
  "messagingSenderId": "YOUR_SENDER_ID",
  "measurementId": "YOUR_MEASUREMENT_ID"
}
Ensure firebase.ts initializes with:

ts
export const db = getFirestore(app);
export const auth = getAuth(app);
🌐 Deployment
Push code to GitHub.

Connect repo to Vercel.

Add your deployed domain (e.g., taskflow.vercel.app) to Firebase → Authentication → Authorized domains.

Deploy and test Google Sign‑In live.

📸 Screenshots
(Add screenshots of your app UI here once deployed)

👨‍💻 Author
Sahil Burele  
Final‑year B.Tech student | Full Stack Developer | Firebase + React Enthusiast
GitHub Profile (github.com in Bing)

⭐ Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you’d like to change.

📜 License
This project is licensed under the MIT License.
