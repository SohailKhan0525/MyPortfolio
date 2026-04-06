import { useRef, useState } from 'react';
import emailjs from '@emailjs/browser';

const CONFIG = {
  emailJS: {
    publicKey: "YITu4swbGHXKFsR0q",
    serviceID: "service_kmvnnax",
    templateID: "template_yadt1ng"
  }
};

const Contact = () => {
  const formRef = useRef(null);
  const [btnText, setBtnText] = useState('SEND');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBtnText('TRANSMITTING...');
    try {
      await emailjs.send(
        CONFIG.emailJS.serviceID,
        CONFIG.emailJS.templateID,
        {
          from_name: formRef.current.querySelector('#name').value,
          email: formRef.current.querySelector('#email').value,
          reply_to: formRef.current.querySelector('#email').value,
          message: formRef.current.querySelector('#message').value,
        },
        CONFIG.emailJS.publicKey
      );
      setBtnText('SUCCESS');
      formRef.current.reset();
      setTimeout(() => setBtnText('SEND'), 3000);
    } catch (err) {
      console.error(err);
      setBtnText('FAILED');
      setTimeout(() => setBtnText('SEND'), 3000);
    }
  };

  return (
    <section id="contact">
      <div className="glass-panel contact-panel reveal reveal-left">
        <div className="contact-left">
          <h2>Get in <br />Touch</h2>
          <p>Interested in learning, collaborating, and working on AI and machine learning projects.</p>
          <div className="social-links">
            <a href="https://www.linkedin.com/in/mohd-zaheer-uddin-166b3b356/" target="_blank" rel="noreferrer">LINKEDIN</a>
            <a href="https://github.com/SohailKhan0525" target="_blank" rel="noreferrer">GITHUB</a>
            <a href="https://www.instagram.com/sohailkhan0525/" target="_blank" rel="noreferrer">INSTAGRAM</a>
          </div>
        </div>
        <form id="contact-form" ref={formRef} onSubmit={handleSubmit}>
          <div className="form-group">
            <input type="text" id="name" required placeholder=" " />
            <label htmlFor="name">Your Name</label>
          </div>
          <div className="form-group">
            <input type="email" id="email" required placeholder=" " />
            <label htmlFor="email">Email Address</label>
          </div>
          <div className="form-group">
            <textarea id="message" required placeholder=" "></textarea>
            <label htmlFor="message">Your Message</label>
          </div>
          <button type="submit" className="submit-btn">
            <span>{btnText}</span>
            <div className="btn-bg"></div>
          </button>
        </form>
      </div>
    </section>
  );
};

export default Contact;
