import Link from "next/link";
import { Header, CopyEmail } from "./PortfolioControls";
import { projects, skills, aiEra } from "./portfolio-data";

const email = "sohailkhannnn.0525@gmail.com";
const github = "https://github.com/SohailKhan0525";
const linkedin = "https://www.linkedin.com/in/mohd-zaheer-uddin-166b3b356/";
const arrow = <span aria-hidden="true">↗</span>;

export default function Home() {
  return (
    <div className="site-shell">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Header />
      <main id="main">
        <section id="top" className="hero">
          <div className="hero-meta">
            <span className="eyebrow">Portfolio / ML &amp; Data Science</span>
            <span className="availability">
              <i aria-hidden="true" /> Open to internships
            </span>
          </div>
          <h1>
            Mohd Zaheer
            <br />
            <em>Uddin.</em>
            <span className="hero-asterisk" aria-hidden="true">
              ✳
            </span>
          </h1>
          <div className="hero-bottom">
            <div>
              <p className="hero-intro">
                Learning the theory.
                <br />
                Building things with it.
              </p>
              <p className="hero-description">
                I’m a CSIT undergraduate working with Python, machine learning,
                and data. This is a collection of my experiments, applications,
                and work in progress.
              </p>
              <a className="button button-primary" href="#work">
                Explore my work <span aria-hidden="true">↓</span>
              </a>
            </div>
            <aside className="field-note">
              <p className="eyebrow">Currently exploring</p>
              <p>
                From a dataset to
                <br />
                <em>something you can use.</em>
              </p>
              <div>
                <span>01 / Python &amp; ML</span>
                <span>02 / Interactive apps</span>
                <span>03 / AI-assisted products</span>
              </div>
            </aside>
          </div>
          <div className="hero-foot">
            <span>Code, experiments &amp; lessons along the way.</span>
            <span>Scroll to explore ↓</span>
          </div>
        </section>

        <section id="work" className="section-block">
          <div className="section-heading">
            <div>
              <p className="eyebrow">01 / Selected work</p>
              <h2>
                Built to learn.
                <br />
                <em>Made to try.</em>
              </h2>
            </div>
            <p>
              Seven projects across machine learning and Python. Explore an app,
              or go straight to the source.
            </p>
          </div>
          <div className="project-list">
            {projects.map((p) => (
              <article className="project-row" key={p[0]}>
                <span className="project-number">{p[0]}</span>
                <div className="project-copy">
                  <p className="project-type">{p[2]}</p>
                  <h3>{p[1]}</h3>
                  <p>{p[3]}</p>
                  <ul className="stack-row" aria-label={`${p[1]} technologies`}>
                    {p[4].map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                </div>
                <div className="project-links">
                  {p[5] !== p[6] && (
                    <a
                      href={p[5]}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`Try ${p[1]} (opens in a new tab)`}
                    >
                      Try the app {arrow}
                    </a>
                  )}
                  <a
                    href={p[6]}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`${p[1]} source code (opens in a new tab)`}
                  >
                    Source code {arrow}
                  </a>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="ai-era" className="section-block building-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">02 / In the workshop</p>
              <h2>
                A little beyond
                <br />
                <em>the coursework.</em>
              </h2>
            </div>
            <p>
              I also build with AI coding agents: writing specs, making product
              decisions, and reviewing the code. These are the projects I’m
              exploring.
            </p>
          </div>
          <div className="workshop-grid">
            {aiEra.map((item, i) => (
              <article className="workshop-item" key={item.id}>
                <div className="workshop-meta">
                  <span>0{i + 1}</span>
                  <span>{item.tag}</span>
                </div>
                <h3>{item.name}</h3>
                <p>
                  {item.id === "loopproof"
                    ? "A testimonial tool for solo founders. Collect and approve feedback, embed it on a site, and turn it into social post drafts."
                    : item.id === "qofeno"
                      ? "A platform for web utilities, from lightweight browser tools to heavier PDF, image, and media processing."
                      : "An open-source command-line tool published on npm. A project in building, testing, and maintaining software other developers can use."}
                </p>
                <ul className="stack-row">
                  {item.stack.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
                <details>
                  <summary>
                    Notes on the process <span aria-hidden="true">+</span>
                  </summary>
                  <p>{item.why}</p>
                </details>
              </article>
            ))}
          </div>
        </section>

        <section id="about" className="section-block about-section">
          <div>
            <p className="eyebrow">03 / A bit about me</p>
            <h2>
              Still learning.
              <br />
              <em>Always making.</em>
            </h2>
          </div>
          <div className="about-copy">
            <p className="large-copy">
              I’m a Computer Science (CSIT) undergraduate, focused on Python,
              machine learning, and data analysis.
            </p>
            <p>
              I started with Python fundamentals: syntax, OOP, files, and data
              structures. Now I’m working through regression, classification,
              and model evaluation, and turning those experiments into
              interactive apps.
            </p>
            <p>
              I’m looking for an internship where I can contribute to useful
              projects and learn from an engineering team.
            </p>
            <Link className="text-button" href="/resume">
              View my resume {arrow}
            </Link>
            <div id="skills" className="toolkit">
              <p className="eyebrow">My current toolkit</p>
              <dl>
                {skills.map(([name, desc]) => (
                  <div key={name}>
                    <dt>{name}</dt>
                    <dd>{desc}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </section>

        <section id="contact" className="contact-section">
          <p className="eyebrow">04 / Get in touch</p>
          <h2>
            Have something
            <br />
            <em>in mind?</em> <span aria-hidden="true">↗</span>
          </h2>
          <div className="contact-bottom">
            <div>
              <p>
                For internships, collaborations, or a conversation about a
                project.
              </p>
              <a className="email-link" href={`mailto:${email}`}>
                {email}
              </a>
              <CopyEmail email={email} />
            </div>
            <div className="social-links">
              <a href={linkedin} target="_blank" rel="noreferrer">
                LinkedIn {arrow}
              </a>
              <a href={github} target="_blank" rel="noreferrer">
                GitHub {arrow}
              </a>
            </div>
          </div>
        </section>
      </main>
      <footer className="site-footer">
        <span>© 2026 Mohd Zaheer Uddin</span>
        <div>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <a href="#top">Back to top ↑</a>
        </div>
      </footer>
    </div>
  );
}
