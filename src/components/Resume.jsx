const Resume = () => {
  return (
    <section id="resume">
      <div className="section-header reveal">
        <h2 className="section-title">RESUME</h2>
        <div className="line"></div>
      </div>
      <div className="resume-wrapper reveal">
        <div className="resume-actions">
          <a href="MohdZaheerUddinResume.pdf" target="_blank" rel="noreferrer" className="resume-action-btn primary-action">
            <i className="fa-solid fa-expand"></i>
            <span>View Fullscreen</span>
          </a>
          <a href="MohdZaheerUddinResume.pdf" download className="resume-action-btn secondary-action">
            <i className="fa-solid fa-download"></i>
            <span>Download Resume</span>
          </a>
        </div>
        <div className="resume-frame-container">
          <embed
            src="MohdZaheerUddinResume.pdf#toolbar=0&navpanes=0"
            type="application/pdf"
            title="Mohd Zaheer Uddin Resume"
            className="resume-embed"
          />
          <div className="resume-fallback">
            <p>Unable to display PDF.{' '}
              <a href="MohdZaheerUddinResume.pdf" target="_blank" rel="noreferrer" className="resume-fallback-link">Open in new tab</a>
            </p>
          </div>
        </div>
        <div className="resume-mobile-card">
          <i className="fa-solid fa-file-lines resume-mobile-icon"></i>
          <p className="resume-mobile-title">MY RESUME</p>
          <p className="resume-mobile-subtitle">PDF preview is not supported on mobile. Use the buttons below to open or download.</p>
          <div className="resume-mobile-actions">
            <a href="MohdZaheerUddinResume.pdf" target="_blank" rel="noreferrer" className="resume-action-btn primary-action">
              <i className="fa-solid fa-arrow-up-right-from-square"></i>
              <span>Open Resume</span>
            </a>
            <a href="MohdZaheerUddinResume.pdf" download className="resume-action-btn secondary-action">
              <i className="fa-solid fa-download"></i>
              <span>Download</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Resume;
