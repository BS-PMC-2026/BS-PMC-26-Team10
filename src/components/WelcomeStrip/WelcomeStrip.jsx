import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
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
            A place to taste, explore, and enjoy
          </p>
          <h2 className="welcome-strip-title">More than a farm visit</h2>
          <p className="welcome-strip-subtitle">
            ChiliLand brings together local flavors, beautiful scenery, and
            experiences you will want to come back to.
          </p>
        </div>

        <div className="welcome-strip-swiper">
          {images.map((src, i) => (
            <img
              key={i}
              src={src}
              alt={`Farm image ${i + 1}`}
              className={`swiper-slide${i === current ? " swiper-slide--active" : ""}`}
            />
          ))}
          <div className="swiper-dots">
            {images.map((_, i) => (
              <button
                key={i}
                className={`swiper-dot${i === current ? " swiper-dot--active" : ""}`}
                onClick={() => setCurrent(i)}
                aria-label={`Go to image ${i + 1}`}
              />
            ))}
          </div>
        </div>

        <div className="welcome-strip-cta">
          <Link to="/tours" className="welcome-strip-cta-btn">
            View Tours &amp; Book a Spot
          </Link>

          <Link
            to="/about"
            className="welcome-strip-cta-btn welcome-strip-cta-btn--secondary"
          >
            About the Farm
          </Link>

          <Link
            to="/farm-location"
            className="welcome-strip-cta-btn welcome-strip-cta-btn--secondary"
          >
            Farm Location
          </Link>
        </div>
      </div>
    </section>
  );
}

export default WelcomeStrip;
