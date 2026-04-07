import React from "react";
import "./HeaderVisitor.css";
import headerDeskVideo from "/src/assets/header-desk.mp4";
import headerMobVideo from "/src/assets/header-mob.mp4";

function HeaderVisitor() {
  return (
    <header className="farm-header">
      <video
        className="farm-video farm-video-desktop"
        autoPlay
        muted
        loop
        playsInline
      >
        <source src={headerDeskVideo} type="video/mp4" />
      </video>

      <video
        className="farm-video farm-video-mobile"
        autoPlay
        muted
        loop
        playsInline
      >
        <source src={headerMobVideo} type="video/mp4" />
      </video>

      <div className="farm-overlay"></div>

      <div className="farm-content">
        <p className="farm-kicker">Welcome to ChiliLand</p>

        <h1 className="farm-title">
          Experience the world of chilli
        </h1>

        <p className="farm-subtitle">
          Walk through our fields, taste fresh products, and discover the flavor
          of ChiliLand.
        </p>

        <div className="farm-buttons">
          <button className="farm-btn primary">Book a Tour</button>
          <button className="farm-btn secondary">Browse Products</button>
        </div>
      </div>

      <div className="farm-scroll">↓ explore</div>
    </header>
  );
}

export default HeaderVisitor;