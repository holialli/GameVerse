import React, { useState } from 'react';
import { db } from '../../services/firebaseConfig'; 
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import styles from './Contact.module.css';
const Contact = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null); // 'success' or 'error'

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      // Add a new document to the 'messages' collection in Firestore 
      await addDoc(collection(db, 'messages'), {
        name: name,
        email: email,
        message: message,
        submittedAt: serverTimestamp(),
      });

      setSubmitStatus('success');
      // Clear form
      setName('');
      setEmail('');
      setMessage('');
    } catch (error) {
      console.error('Error adding document: ', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="section">
      <div className="section-header">
        <h1 className="section-title">Contact Us</h1>
        <p className="section-desc">Questions, feedback, or collaborations? We would love to hear from you.</p>
      </div>

      <div className={styles.contactGrid}>
        <div className={`${styles.contactCard} ${styles.panel}`}>
          <h2 className="card-title">Send a Message</h2>
          <form className={styles.formGrid} onSubmit={handleSubmit}>
            <div className={styles.formRow}>
              <label htmlFor="name">Name</label>
              <input
                className={styles.input}
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                required
              />
            </div>
            <div className={styles.formRow}>
              <label htmlFor="email">Email</label>
              <input
                className={styles.input}
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>
            <div className={styles.formRow}>
              <label htmlFor="message">Message</label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tell us what’s on your mind"
                required
              ></textarea>
            </div>
            <div className={styles.formRow}>
              <button className="button primary" type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Sending...' : 'Send Message'}
              </button>
            </div>
            {submitStatus === 'success' && (
              <p className={styles.successMsg}>Message sent! Thank you.</p>
            )}
            {submitStatus === 'error' && (
              <p className={styles.errorMsg}>Error: Could not send message.</p>
            )}
          </form>
        </div>
        
      </div>
    </section>
  );
};

export default Contact;