import React, { useState, useEffect } from 'react';
import localData from '../../data/db.json';
import styles from './Events.module.css'; 

const Events = () => {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    setEvents(localData.events);
  }, []);

  return (
    <section className="section">
      <div className="section-header">
        <h1 className="section-title">Events & Tournaments</h1>
        <p className="section-desc">LANs, championships, cosplay meetups, and more. Mark your calendar.</p>
      </div>

      <div className={styles.eventsGrid}>
        {events.map((event) => (
          <article key={event.id} className={styles.eventCard}>
            <div className={styles.eventDate}>
              <span className={styles.eventDay}>{event.day}</span>
              <span className={styles.eventMonth}>{event.month}</span>
            </div>
            <div className={styles.eventBody}>
              <h2 className={styles.eventTitle}>{event.title}</h2>
              <p className={styles.eventMeta}>{event.meta}</p>
              <p>{event.description}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

export default Events;