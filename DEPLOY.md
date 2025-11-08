# Deploying ChatKin (quick)

1. Extract zip:
   unzip ChatKin-Deploy.zip
   cd ChatKin

2. Initialize git (optional) and push to GitHub:
   git init
   git add .
   git commit -m "Initial ChatKin commit"
   # Create repo on GitHub and push...

3. Deploy to Render:
   - Create new Web Service from GitHub repo named `chatkin-ai`
   - Set env vars: OPENAI_API_KEY, JWT_SECRET, DATABASE_URL, FEATURES_AUTH, FEATURES_STREAMING
   - Start command: node server/index.js
