export const projects = [
  [
    "01",
    "House Price Prediction",
    "Regression",
    "Predicting house prices with Python and a practical ML workflow.",
    ["Python", "pandas", "NumPy", "scikit learn"],
    "https://housepriceprediction-rqo8ykwgldxbpemwl6kvok.streamlit.app/",
    "https://github.com/SohailKhan0525/HousePricePrediction",
  ],
  [
    "02",
    "Global Earthquake Prediction",
    "Classification",
    "An applied classification project exploring earthquake prediction.",
    ["Python", "pandas", "NumPy", "scikit learn"],
    "https://github.com/SohailKhan0525/Global-Earthquake-Prediction",
    "https://github.com/SohailKhan0525/Global-Earthquake-Prediction",
  ],
  [
    "03",
    "Heart Disease Prediction",
    "Logistic regression",
    "A Streamlit app turning a classification model into an interactive experience.",
    ["Python", "scikit learn", "Streamlit"],
    "https://heartdiseaseml-4zrcurmudxpfxbwygcuyytm.streamlit.app/",
    "https://github.com/SohailKhan0525/HeartDiseaseML",
  ],
  [
    "04",
    "Student Management",
    "Python app",
    "A practical student management application with a hosted interface.",
    ["Python", "Streamlit"],
    "https://studentmanagementproject-ulj54ytmcyj55upzakbzhn.streamlit.app/",
    "https://github.com/SohailKhan0525/StudentManagementProject",
  ],
  [
    "05",
    "Student Pass / Fail Predictor",
    "Classification",
    "A small interactive application for predicting student outcomes.",
    ["Python", "scikit learn", "Streamlit"],
    "https://studentfailpasspredictor-hjymwbpsp4bksec9ycb2xz.streamlit.app/",
    "https://github.com/SohailKhan0525/StudentFailPassPredictor",
  ],
  [
    "06",
    "Bank Management",
    "Python app",
    "A practical project focused on application logic and Python fundamentals.",
    ["Python", "Streamlit"],
    "https://bankmanagementproject-brt9pt282uavy8ddzzy7ql.streamlit.app/",
    "https://github.com/SohailKhan0525/BankManagementProject",
  ],
  [
    "07",
    "File Handling",
    "Python CLI",
    "A focused project for everyday file operations and application code.",
    ["Python", "OOP", "pathlib", "JSON"],
    "https://github.com/SohailKhan0525/File_Handling_Project",
    "https://github.com/SohailKhan0525/File_Handling_Project",
  ],
] as const;

export const skills = [
  ["Python", "Primary language"],
  ["scikit learn", "ML workflows"],
  ["pandas", "Data analysis"],
  ["NumPy", "Numerical computing"],
  ["Streamlit", "Interactive apps"],
  ["Git / GitHub", "Version control"],
  ["HTML / CSS / JS", "Web foundations"],
];

export const aiEra = [
  {
    id: "loopproof",
    name: "LoopProof",
    tag: "SaaS product",
    status: "Building",
    blurb:
      "An AI-powered testimonial and social-proof tool for solo founders and indie hackers — collect text testimonials through a shareable link, review and approve them, embed them on a site, then let AI repurpose the approved ones into ready LinkedIn and X post drafts.",
    why: "I mapped the whole product in a detailed prompt document and I'm building it phase by phase with an AI coding agent — domain first, then services, then one page at a time — while I own every product and data decision myself.",
    stack: ["Next.js", "Appwrite", "Cloudflare Pages", "Gemini API", "Clerk"],
  },
  {
    id: "qofeno",
    name: "Qofeno Labs",
    tag: "Web tools platform",
    status: "~85% complete",
    blurb:
      "A platform aiming for 1,000+ free and paid web-based tools — lightweight tools run on serverless functions, heavier jobs like PDF, image, and media processing route to dedicated cloud containers with scale-to-zero cost protection.",
    why: "This is a bigger system than I could hand-build alone at my current stage. AI helps me scaffold the architecture fast, and I use that speed to actually study why each piece works instead of just shipping it blind.",
    stack: ["React", "Vite", "Appwrite", "Azure Container Apps", "Cloudflare"],
  },
  {
    id: "agentx",
    name: "AI AgentX CLI",
    tag: "Open-source CLI",
    status: "Live · 26,000+ downloads",
    blurb:
      "An open-source command-line tool published on npm and used by other developers — the most public proof I have that AI-assisted building can ship something people actually install and run.",
    why: "Open source keeps me honest about this: the code is public, so I have to read, test, and actually understand every part an AI helps me write before it goes out into anyone else's terminal.",
    stack: ["Node.js", "npm", "CLI tooling"],
  },
] as const;
