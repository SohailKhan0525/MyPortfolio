import { SplitText, TextReveal, ScrollReveal, MagneticButton } from '../reactbits';

const About = () => {
  return (
    <section id="about" className="about-section">
      <div className="about-container">
        <ScrollReveal
          animationFrom={{ opacity: 0, x: -50 }}
          animationTo={{ opacity: 1, x: 0 }}
          className="about-text"
        >
          <h2 className="about-title">
            <SplitText text="ABOUT ME" splitBy="chars" />
          </h2>
          <TextReveal delay={0.1}>
            <p>I am a Computer Science (CSIT) undergraduate specializing in Machine Learning and Data Science. I focus on building predictive models and deploying real-world ML applications using Python and Scikit-learn.</p>
          </TextReveal>
          <TextReveal delay={0.2}>
            <p>I have a strong foundation in data analysis, statistical modeling, and Python programming with hands-on experience in regression, classification, and neural networks.</p>
          </TextReveal>
          <TextReveal delay={0.3}>
            <p>I'm passionate about solving real-world problems through machine learning and actively seeking internship opportunities to grow my expertise and contribute to impactful AI projects.</p>
          </TextReveal>
          <TextReveal delay={0.4}>
            <p className="about-goal">My goal is to become a proficient ML Engineer while continuously learning and applying cutting-edge techniques to solve complex problems.</p>
          </TextReveal>
          <div className="about-buttons">
            <MagneticButton>
              <a href="#resume" className="resume-btn">
                <span>VIEW RESUME</span>
                <i className="fa-solid fa-arrow-down"></i>
              </a>
            </MagneticButton>
            <MagneticButton>
              <a href="#contact" className="hire-me-btn">
                <span>HIRE ME</span>
                <i className="fa-solid fa-handshake"></i>
              </a>
            </MagneticButton>
          </div>
        </ScrollReveal>
        <div className="about-logo reveal reveal-right delay-200">
          <img src={`${import.meta.env.BASE_URL}main.png`} alt="QOFENO Labs Logo" />
        </div>
      </div>
    </section>
  );
};

export default About;
