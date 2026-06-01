import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "./WelcomeStrip.css";

import img1 from "../../assets/imgae1.jpeg";
import img2 from "../../assets/imgae2.jpeg";
import img3 from "../../assets/imgae3.jpeg";
import img4 from "../../assets/image4.jpeg";
import img5 from "../../assets/image5.jpeg";
import img6 from "../../assets/image6.jpeg";
import img7 from "../../assets/image7.jpeg";

const images = [img1, img2, img3, img4, img5, img6, img7];

function WelcomeStrip() {
  const { t } = useTranslation();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % images.length);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="welcome-strip">
      <div className="welcome-strip-inner">
        <div className="welcome-strip-heading">
          <p className="welcome-strip-kicker">
            {t('welcome.kicker')}
          </p>
          <h2 className="welcome-strip-title">{t('welcome.title')}</h2>
          <p className="welcome-strip-subtitle">
            {t('welcome.subtitle')}
          </p>
        </div>

        <div className="welcome-strip-swiper">
          {images.map((src, i) => (
            <img
              key={i}
              src={src}
              alt={t('welcome.imgAlt', { n: i + 1 })}
              className={`swiper-slide${i === current ? " swiper-slide--active" : ""}`}
            />
          ))}
          <div className="swiper-dots">
            {images.map((_, i) => (
              <button
                key={i}
                className={`swiper-dot${i === current ? " swiper-dot--active" : ""}`}
                onClick={() => setCurrent(i)}
                aria-label={t('welcome.imgAlt', { n: i + 1 })}
              />
            ))}
          </div>
        </div>

        <div className="welcome-strip-cta">
          <Link to="/tours" className="welcome-strip-cta-btn">
            {t('welcome.btnTours')}
          </Link>

          <Link
            to="/about"
            className="welcome-strip-cta-btn welcome-strip-cta-btn--secondary"
          >
            {t('welcome.btnAbout')}
          </Link>

          <Link
            to="/farm-location"
            className="welcome-strip-cta-btn welcome-strip-cta-btn--secondary"
          >
            {t('welcome.btnLocation')}
          </Link>
        </div>
      </div>
    </section>
  );
}

export default WelcomeStrip;
