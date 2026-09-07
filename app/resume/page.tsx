"use client";

import Link from "next/link";

const projects = [
  ["House Price Prediction", "Regression", "Python, pandas, NumPy, scikit learn"],
  ["Global Earthquake Prediction", "Classification", "Python, pandas, NumPy, scikit learn"],
  ["Heart Disease Prediction", "Logistic regression", "Python, scikit learn, Streamlit"],
  ["Student Management", "Python app", "Python, Streamlit"],
  ["Student Pass / Fail Predictor", "Classification", "Python, scikit learn, Streamlit"],
  ["Bank Management", "Python app", "Python, Streamlit"],
  ["File Handling", "Python CLI", "Python, OOP, pathlib, JSON"],
];

export default function ResumePage() {
  return (
    <main className="resume-shell">
      <div className="resume-top">
        <div>
          <Link href="/" className="text-button"><span aria-hidden="true">←</span> Back to portfolio</Link>
          <p className="eyebrow resume-eyebrow">Resume</p>
          <h1>Mohd Zaheer Uddin</h1>
          <p>Computer Science (CSIT) undergraduate · Machine Learning · Data Science</p>
        </div>
        <div className="resume-actions">
          <button className="button button-secondary" onClick={() => window.print()}><span aria-hidden="true">⎙</span> Print</button>
          <Link className="button button-primary" href="https://github.com/SohailKhan0525" target="_blank"><span aria-hidden="true">↗</span> GitHub</Link>
        </div>
      </div>
      <div className="resume-sheet">
        <section className="resume-section"><h2>Profile</h2><div><p>Computer Science (CSIT) undergraduate specialising in Machine Learning and Data Science. Focused on Python, regression, classification, data analysis, and practical ML applications.</p><p className="resume-intro-secondary">Currently seeking internship opportunities to learn from real engineering teams, contribute to useful projects, and strengthen ML fundamentals.</p></div></section>
        <section className="resume-section"><h2>Projects</h2><div className="resume-list">{projects.map(([name, type, stack]) => <article className="resume-item" key={name}><h3>{name}</h3><p className="resume-meta">{type} · {stack}</p></article>)}</div></section>
        <section className="resume-section"><h2>Skills</h2><div className="resume-skills">{["Python", "scikit learn", "pandas", "NumPy", "Streamlit", "Git / GitHub", "HTML / CSS / JavaScript", "Next.js"].map((skill) => <span key={skill}>{skill}</span>)}</div></section>
        <section className="resume-section"><h2>Learning</h2><div className="resume-list"><article className="resume-item"><h3>Python foundations</h3><p>OOP, file handling, JSON, pathlib.</p></article><article className="resume-item"><h3>Data stack</h3><p>pandas and NumPy for analysis and numerical work.</p></article><article className="resume-item"><h3>Machine learning</h3><p>Regression, classification, and scikit learn workflows.</p></article></div></section>
        <section className="resume-section"><h2>Links</h2><div className="resume-list"><p>GitHub: github.com/SohailKhan0525</p><p>LinkedIn: linkedin.com/in/mohd-zaheer-uddin-166b3b356/</p><p>Email: sohailkhannnn.0525@gmail.com</p></div></section>
      </div>
    </main>
  );
}
