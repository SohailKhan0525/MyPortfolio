const About = () => {
  return (
    <section id="about" className="about-section">
      <div className="about-container">
        <div className="about-text reveal reveal-left">
          <h2 className="about-title">ABOUT ME</h2>
          <p>I am a Computer Science (CSIT) undergraduate specializing in Machine Learning and Data Science. I focus on building predictive models and deploying real-world ML applications using Python and Scikit-learn.</p>
          <p>I have a strong foundation in data analysis, statistical modeling, and Python programming with hands-on experience in regression, classification, and neural networks.</p>
          <p>I'm passionate about solving real-world problems through machine learning and actively seeking internship opportunities to grow my expertise and contribute to impactful AI projects.</p>
          <p className="about-goal">My goal is to become a proficient ML Engineer while continuously learning and applying cutting-edge techniques to solve complex problems.</p>
          <div className="about-buttons">
            <a href="#resume" className="resume-btn">
              <span>VIEW RESUME</span>
              <i className="fa-solid fa-arrow-down"></i>
            </a>
            <a href="#contact" className="hire-me-btn">
              <span>HIRE ME</span>
              <i className="fa-solid fa-handshake"></i>
            </a>
          </div>
        </div>
        <div className="about-logo reveal reveal-right delay-200">
          <img src="/main.png" alt="QOFENO Labs Logo" />
        </div>
      </div>
    </section>
  );
};

export default About;
