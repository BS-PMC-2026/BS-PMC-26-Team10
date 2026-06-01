import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "./HeaderVisitor.css";
import headerDeskVideo from "/src/assets/header-desk.mp4";
import headerMobVideo from "/src/assets/header-mob.mp4";

function HeaderVisitor() {
  const { t } = useTranslation();

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
        <p className="farm-kicker">{t('hero.kicker')}</p>

        <h1 className="farm-title">
          {t('hero.title')}
        </h1>

        <p className="farm-subtitle">
          {t('hero.subtitle')}
        </p>

        <div className="farm-buttons">
          <Link to="/tours" className="farm-btn primary">{t('hero.btnTour')}</Link>
          <Link to="/products" className="farm-btn secondary">{t('hero.btnProducts')}</Link>
        </div>
      </div>

      <div className="farm-scroll">{t('hero.explore')}</div>
    </header>
  );
}

export default HeaderVisitor;
