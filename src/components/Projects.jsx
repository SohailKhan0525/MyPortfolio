import { useEffect, useState } from 'react';

const projectData = {
  'house-price': {
    title: 'HOUSE PRICE PREDICTION',
    description: `Advanced regression model using <b>Random Forest Regressor</b> with <b>Scikit-Learn</b> to predict real estate values with high accuracy. Built with <b>Python</b> and deployed on <b>Streamlit</b> for live predictions.<br><br><b>Model Performance: R² = 0.95 | Random Forest Regressor</b><br><br><b>📚 What I Learned (Expanded)</b><br><br><b>1) Most ML time is spent before modeling</b><br>I learned that preprocessing is the core of real projects. The raw data had mixed formats, missing values, and text-heavy fields. Cleaning them correctly was more important than quickly fitting a model.`
  },
  'earthquake': {
    title: 'GLOBAL EARTHQUAKE PREDICTION',
    description: `Seismic activity forecasting tool analyzing decades of geological data to assess risk factors. Trained ML model available with predictive capabilities.<br><br><b>📚 What I Learned</b><br><br><b>Results Summary:</b><br>• Random Forest (all 12 features): <b>93.6%</b><br>• Random Forest (without Year & Month): 89.8%<br>• Random Forest (GridSearchCV best, without Year & Month): ~88.8% (CV)<br><br>The baseline Random Forest with all features achieved the highest test accuracy of <b>93.6%</b>, demonstrating that seismic measurements alone can reliably predict tsunami occurrence.`
  },
  'heart-disease': {
    title: 'HEART DISEASE PREDICTION',
    description: `Diagnostic support tool using <b>Logistic Regression</b> to identify potential cardiac health risks. ML model trained on medical datasets for disease prediction.`
  },
  'student-mgmt': {
    title: 'STUDENT MANAGEMENT',
    description: `A Python-based student record system using <b>OOP</b> and a <b>JSON file database</b> for adding, updating, viewing, and removing student data — driven by a menu-based CLI.`
  },
  'student-pass': {
    title: 'STUDENT PASS/FAIL PREDICTOR',
    description: `Classification model to predict student pass or fail outcomes based on academic features.`
  },
  'bank': {
    title: 'BANK MANAGEMENT',
    description: `A Python-based bank system for account creation, deposits, withdrawals, and inquiries.`
  },
  'file-handling': {
    title: 'FILE HANDLING',
    description: `A menu-driven CLI app using <code>pathlib</code> and <code>os</code> to create, read, and delete files with error handling.`
  }
};

const ProjectCard = ({ projectKey, badge, title, description, liveLink, codeLink, modelOnly, noLiveDemo, reveal, onOpenPanel, onOpenModal }) => {
  const [tapped, setTapped] = useState(false);

  const isTouchDevice = () => window.matchMedia('(hover: none) and (pointer: coarse)').matches;

  const handleCardClick = (e) => {
    if (e.target.closest('.link-btn')) return;
    if (isTouchDevice() && !tapped) {
      setTapped(true);
      return;
    }
    setTapped(false);
    onOpenPanel(projectKey);
  };

  return (
    <div
      className={`project-card glass-card tilt-effect reveal${reveal ? ' ' + reveal : ''}${tapped ? ' card-tapped' : ''}`}
      data-project={projectKey}
      onClick={handleCardClick}
    >
      <div className="card-glow"></div>
      <div className="card-hint">
        <i className="fa-solid fa-computer"></i>
        <span>{isTouchDevice() ? 'Tap to learn more' : 'Click to learn more'}</span>
      </div>
      <div className="card-content">
        <div className="tech-badge">{badge}</div>
        <h3>{title}</h3>
        <p>{description}</p>
        <div className="card-links">
          {liveLink && (
            <a href={liveLink} target="_blank" rel="noreferrer" className="link-btn">
              <i className="fa-solid fa-play"></i> LIVE DEMO
            </a>
          )}
          {modelOnly && (
            <button
              type="button"
              id="model-only-btn"
              className="link-btn model-only"
              aria-haspopup="dialog"
              aria-controls="custom-modal"
              aria-expanded="false"
              title="Model only (no live demo)"
              onClick={(e) => { e.stopPropagation(); onOpenModal(); }}
            >
              <i className="fa-solid fa-lock"></i> MODEL ONLY
            </button>
          )}
          {noLiveDemo && (
            <button
              type="button"
              id="no-live-demo-btn"
              className="link-btn model-only"
              aria-haspopup="dialog"
              aria-controls="custom-modal"
              aria-expanded="false"
              title="No live demo available"
              onClick={(e) => { e.stopPropagation(); onOpenModal(); }}
            >
              <i className="fa-solid fa-lock"></i> NO LIVE DEMO
            </button>
          )}
          <a href={codeLink} target="_blank" rel="noreferrer" className="link-btn">
            <i className="fa-brands fa-github"></i> CODE
          </a>
        </div>
      </div>
    </div>
  );
};

const HoverPanel = ({ isOpen, projectKey, onClose }) => {
  const data = projectData[projectKey] || { title: 'Coming Soon', description: 'This project is being updated with more details' };

  return (
    <div id="hover-panel" className={`hover-panel${isOpen ? ' active' : ''}`}>
      <button type="button" className="close-panel-btn" aria-label="Close panel" onClick={onClose}>&times;</button>
      <div className="panel-content">
        <h3 id="panel-title">{data.title}</h3>
        <p id="panel-description" dangerouslySetInnerHTML={{ __html: data.description }}></p>
      </div>
    </div>
  );
};

const Projects = () => {
  const [panelOpen, setPanelOpen] = useState(false);
  const [activePanelKey, setActivePanelKey] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const openPanel = (key) => {
    setActivePanelKey(key);
    setPanelOpen(true);
  };
  const closePanel = () => setPanelOpen(false);

  // Close panel on outside click
  useEffect(() => {
    const handleClick = (e) => {
      const panel = document.getElementById('hover-panel');
      if (panel && !panel.contains(e.target) && !e.target.closest('.project-card')) {
        closePanel();
      }
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  return (
    <>
      <section id="projects">
        <div className="section-header reveal">
          <h2 className="section-title">PROJECTS</h2>
          <div className="line"></div>
        </div>

        <div className="project-gallery">
          <ProjectCard
            projectKey="house-price"
            badge="ML MODEL"
            title="House Price Prediction"
            description="Advanced regression model utilizing Scikit-Learn to predict real estate values with high accuracy."
            liveLink="https://housepriceprediction-rqo8ykwgldxbpemwl6kvok.streamlit.app/"
            codeLink="https://github.com/SohailKhan0525/HousePricePrediction"
            onOpenPanel={openPanel}
            onOpenModal={() => setModalOpen(true)}
          />
          <ProjectCard
            projectKey="earthquake"
            badge="ML MODEL"
            title="Global Earthquake Prediction"
            description="Seismic activity forecasting tool analyzing decades of geological data to assess risk factors."
            modelOnly
            codeLink="https://github.com/SohailKhan0525/Global-Earthquake-Prediction"
            reveal="delay-100"
            onOpenPanel={openPanel}
            onOpenModal={() => setModalOpen(true)}
          />
          <ProjectCard
            projectKey="heart-disease"
            badge="ML MODEL"
            title="Heart Disease Prediction"
            description="Diagnostic support tool using logistic regression to identify potential cardiac health risks."
            liveLink="https://heartdiseaseml-4zrcurmudxpfxbwygcuyyt.streamlit.app/"
            codeLink="https://github.com/SohailKhan0525/HeartDiseaseML"
            reveal="delay-200"
            onOpenPanel={openPanel}
            onOpenModal={() => setModalOpen(true)}
          />
          <ProjectCard
            projectKey="student-mgmt"
            badge="PYTHON"
            title="Student Management"
            description="Backend architecture for academic record keeping and student data processing."
            liveLink="https://studentmanagementproject-ulj54ytmcyj55upzakbzhn.streamlit.app/"
            codeLink="https://github.com/SohailKhan0525/StudentManagementProject"
            onOpenPanel={openPanel}
            onOpenModal={() => setModalOpen(true)}
          />
          <ProjectCard
            projectKey="student-pass"
            badge="ML MODEL"
            title="Student Pass/Fail Predictor"
            description="Classification model to predict student pass or fail outcomes based on academic features."
            liveLink="https://studentfailpasspredictor-hjymwbpsp4bksec9ycb2xz.streamlit.app"
            codeLink="https://github.com/SohailKhan0525/StudentFailPassPredictor"
            reveal="delay-100"
            onOpenPanel={openPanel}
            onOpenModal={() => setModalOpen(true)}
          />
          <ProjectCard
            projectKey="bank"
            badge="PYTHON"
            title="Bank Management"
            description="A Python-based bank system for account creation, deposits, withdrawals, and inquiries."
            liveLink="https://bankmanagementproject-brt9pt282uavy8ddzzy7ql.streamlit.app/"
            codeLink="https://github.com/SohailKhan0525/BankManagementProject"
            reveal="delay-100"
            onOpenPanel={openPanel}
            onOpenModal={() => setModalOpen(true)}
          />
          <ProjectCard
            projectKey="file-handling"
            badge="PYTHON"
            title="File Handling"
            description={<>A menu-driven CLI app using <code>pathlib</code> and <code>os</code> to create, read, and delete files with error handling.</>}
            noLiveDemo
            codeLink="https://github.com/SohailKhan0525/File_Handling_Project"
            reveal="delay-200"
            onOpenPanel={openPanel}
            onOpenModal={() => setModalOpen(true)}
          />
        </div>
      </section>

      <HoverPanel
        isOpen={panelOpen}
        projectKey={activePanelKey}
        onClose={closePanel}
      />

      {modalOpen && (
        <div
          id="custom-modal"
          className="modal-overlay active"
          role="dialog"
          aria-modal="true"
          aria-labelledby="model-modal-title"
          aria-describedby="model-modal-desc"
          onClick={(e) => { if (e.target.id === 'custom-modal') setModalOpen(false); }}
        >
          <div className="modal-content glass-panel">
            <button type="button" className="modal-close" onClick={() => setModalOpen(false)} aria-label="Close dialog">&times;</button>
            <div className="status-pill" aria-hidden="true">MODEL ONLY</div>
            <h3 id="model-modal-title"><i className="fa-solid fa-robot"></i> MODEL STATUS</h3>
            <p id="model-modal-desc">This project has a trained model available, but no live interactive demo is currently deployed.</p>
            <button type="button" id="close-modal" className="btn-3d primary small" onClick={() => setModalOpen(false)}>UNDERSTOOD</button>
          </div>
        </div>
      )}
    </>
  );
};

export default Projects;
