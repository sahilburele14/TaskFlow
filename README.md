# TaskFlow

TaskFlow is a productivity web application built with **React + Firebase** that helps users manage tasks efficiently while offering secure authentication via **Google Sign‑In**.

🔗 **Live Demo:** [task-flow-sage-chi.vercel.app](https://task-flow-sage-chi.vercel.app)  
📂 **Source Code:** [GitHub Repository](https://github.com/sahilburele14/TaskFlow/tree/main)

---

## 🚀 Features
- 🔐 **Authentication**: Google Sign‑In powered by Firebase Authentication
- 📂 **Database**: Firestore for real‑time task storage
- 🎨 **UI/UX**: Responsive design with modern components
- ☁️ **Deployment**: Hosted on Vercel
- ⚡ **Performance**: Optimized builds and clean configuration

---

## 🛠️ Tech Stack
- **Frontend**: React, TypeScript, Vite
- **Backend/Services**: Firebase Authentication, Firestore
- **Deployment**: Vercel
- **Version Control**: Git + GitHub

---

## 📦 Installation

Clone the repository and install dependencies:

bash
git clone https://github.com/sahilburele14/TaskFlow.git
cd TaskFlow
npm install

▶️ Running Locally
Start the development server:

bash
npm run dev
Open http://localhost:3000 in your browser.

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

Add your deployed domain (task-flow-sage-chi.vercel.app) to Firebase → Authentication → Authorized domains.

Deploy and test Google Sign‑In live.

📸 Screenshots
<img width="1905" height="1023" alt="image" src="https://github.com/user-attachments/assets/5ed1f3fa-ae3e-4b97-8d5b-5b6ac768db24" />
<img width="773" height="903" alt="image" src="https://github.com/user-attachments/assets/69a10701-4da8-4e00-a58a-6f22220fd898" />
<img width="1857" height="916" alt="image" src="https://github.com/user-attachments/assets/d19a8de4-ebb9-4ecc-bd15-b8b01c88522b" />
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/d1e30293-397e-4db6-bc4c-764a6500d60e" />
<img width="1898" height="969" alt="image" src="https://github.com/user-attachments/assets/4fc445ae-defe-4684-a9eb-a67f90433a8e" />


👨‍💻 Author
Sahil Burele  
Final‑year B.Tech student | Full Stack Developer | Firebase + React Enthusiast
GitHub: @sahilburele14 (github.com in Bing)

⭐ Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you’d like to change.

📜 License
This project is licensed under the MIT License.
