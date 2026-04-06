const skills = [
  { icon: 'fa-brands fa-python', name: 'Python', percent: 100 },
  { icon: 'fa-solid fa-brain', name: 'Machine Learning', percent: 70 },
  { icon: 'fa-solid fa-square-root-variable', name: 'Linear Algebra', percent: 60 },
  { icon: 'fa-solid fa-infinity', name: 'Calculus', percent: 50 },
  { icon: 'fa-solid fa-divide', name: 'Probability', percent: 50 },
  { icon: 'fa-solid fa-chart-area', name: 'Statistics', percent: 50 },
  { icon: 'fa-brands fa-git', name: 'Git & Github', percent: 100 },
  { icon: 'fa-brands fa-linux', name: 'Linux', percent: 50 },
  { icon: 'fa-solid fa-database', name: 'Data Structures', percent: 50 },
  { icon: 'fa-solid fa-network-wired', name: 'Deep Learning', percent: 1 },
  { icon: 'fa-solid fa-code', name: 'SQL', percent: 1 },
  { icon: 'fa-solid fa-broom', name: 'Data Cleaning', percent: 40 },
  { icon: 'fa-solid fa-chart-pie', name: 'Data Visualization', percent: 30 },
  { icon: 'fa-solid fa-magnifying-glass-chart', name: 'EDA', percent: 55 },
  { icon: 'fa-brands fa-python', name: 'Numpy', percent: 30 },
  { icon: 'fa-brands fa-python', name: 'Pandas', percent: 30 },
  { icon: 'fa-brands fa-python', name: 'Matplotlib', percent: 30 },
  { icon: 'fa-brands fa-python', name: 'Scikit-learn', percent: 40 },
  { icon: 'fa-solid fa-book', name: 'Jupyter', percent: 60 },
  { icon: 'fa-brands fa-kaggle', name: 'Kaggle', percent: 95 },
  { icon: 'fa-brands fa-python', name: 'Pytorch', percent: 1 },
  { icon: 'fa-brands fa-python', name: 'Seaborn', percent: 45 },
];

const Skills = () => {
  return (
    <section id="skills">
      <div className="section-header reveal">
        <h2 className="section-title">SKILLS &amp; TOOLS I KNOW</h2>
        <div className="line"></div>
      </div>
      <div className="skills-grid reveal">
        {skills.map(({ icon, name, percent }) => (
          <div className="skill-block" key={name}>
            <div className="skill-icon"><i className={icon}></i></div>
            <h4>{name}</h4>
            <span className={`skill-percent ${percent >= 70 ? 'green' : 'red'}`}>{percent}%</span>
            <div className="progress-bar">
              <div className="progress" style={{ width: `${percent}%` }}></div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Skills;
