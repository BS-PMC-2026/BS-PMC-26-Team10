import React from "react";
import "./WelcomeStrip.css";

function WelcomeStrip() {
  const items = [
    {
      title: "Fresh From the Farm",
      text: "Locally grown chillies, picked with care and full of flavor.",
    },
    {
      title: "Guided Tours",
      text: "Walk through the farm and discover the story behind every pepper.",
    },
    {
      title: "Handmade Products",
      text: "Unique sauces, spices, and farm-made goods prepared with passion.",
    },
    {
      title: "Family Experience",
      text: "A warm and memorable visit for friends, couples, and families.",
    },
  ];

  return (
    <section className="welcome-strip">
      <div className="welcome-strip-inner">
        <div className="welcome-strip-heading">
          <p className="welcome-strip-kicker">A place to taste, explore, and enjoy</p>
          <h2 className="welcome-strip-title">More than a farm visit</h2>
          <p className="welcome-strip-subtitle">
            ChiliLand brings together local flavors, beautiful scenery, and
            experiences you will want to come back to.
          </p>
        </div>

        <div className="welcome-strip-grid">
          {items.map((item, index) => (
            <article className="welcome-strip-card" key={index}>
              <div className="welcome-strip-icon">
                <span></span>
              </div>

              <h3 className="welcome-strip-card-title">{item.title}</h3>
              <p className="welcome-strip-card-text">{item.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default WelcomeStrip;