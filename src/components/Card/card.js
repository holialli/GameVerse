import React from 'react';
import { Link } from 'react-router-dom';
// styles are defined in base.css

const Card = ({ title, meta, image, link, linkLabel }) => {
  return (
    <article className="card">
      {image && <img className="card-media" src={image} alt="" />}
      <div className="card-body">
        <h3 className="card-title">{title}</h3>
        <p className="card-meta">{meta}</p>
        {link && (
          <Link to={link} className="pill">
            {linkLabel}
          </Link>
        )}
      </div>
    </article>
  );
};

export default Card;