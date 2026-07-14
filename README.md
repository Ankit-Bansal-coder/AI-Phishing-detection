# PHISH.AI // Cyber Threat Intelligence Dashboard

An interactive dashboard that uses client-side Machine Learning to detect phishing websites. 

The core predictive engine uses **Logistic Regression** and **Decision Tree** models. Both classifiers are trained via a Python scikit-learn script on a generated, rules-based synthetic dataset of 10,000 URLs. Model weights and paths are serialized to JSON, enabling zero-latency, private, client-side browser inference without requiring a live Python backend.

---

## 🛠️ Architecture & Features

1. **Python ML Training Pipeline (`python/train.py`)**:
   - Generates 10,000 synthetic URLs (5,000 legitimate, 5,000 phishing) representing modern threat vectors.
   - Extracts 12 mathematical URL heuristics (length, `@` symbols, redirect slashes, subdomain counts, shortening domains, suspicious keywords, suspicious TLDs, and delimiter ratios).
   - Trains a Logistic Regression model and a Decision Tree Classifier (`max_depth=4`).
   - Exports the parameters, thresholds, and performance metrics (Accuracy, ROC curve, and Confusion Matrix) directly to `src/assets/phishing_model.json`.

2. **Heuristics Dissection Engine (`src/utils/featureExtractor.js`)**:
   - Extract numerical vectors from inputted links dynamically in the browser, matching the Python pipeline exactly.

3. **Explanatory Analytics (X-Ray Mode)**:
   - Visualizes Logistic Regression coefficients ($w_i$), letting the user inspect mathematical contributions.
   - Traces Decision Tree nodes, rendering an illuminated path of conditions showing exactly why a site was classified.

4. **Security Sandbox Simulator**:
   - A mock browser viewport that triggers chrome-like interstitial red warnings on flagged URLs.
   - Demonstrates credential harvesting if warning pages are bypassed, capturing inputs securely in the local context.

5. **Training Playground**:
   - Displays real pipeline metrics (ROC Curve, Confusion Matrix).
   - Features sliders to adjust ML weights in real-time to watch the model decision boundary shift.

---

## 🚀 Setup & Execution

### 1. Requirements
Ensure you have the following installed on your system:
- **Node.js** (v18.0.0 or later)
- **Python 3.10** (or later)

### 2. Install and Train the Model
The React application loads model parameters from a JSON file. Run the Python pipeline to build the training set, fit the classifiers, and export the file.

```bash
# Navigate to the python pipeline directory
cd python

# Set up virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install pandas, numpy, and scikit-learn
pip install -r requirements.txt

# Run the training script
python train.py
```

### 3. Launch Frontend Web App
Install Vite packages and start the hot-reloading development server:

```bash
# Navigate back to the project root directory
cd ..

# Install dependencies
npm install

# Start local server
npm run dev
```

Open the URL shown (typically `http://localhost:5173`) in your browser to interact with the dashboard.
