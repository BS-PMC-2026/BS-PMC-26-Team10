import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { CLMonogram } from "../ChiliMark/ChiliMark";
import "./FooterVisitor.css";

function FooterVisitor() {
  const { t } = useTranslation();

  return (
    <footer className="visitor-footer">
      <div className="visitor-footer-inner">

        {/* LEFT / BRAND */}
        <div className="footer-col footer-brand">
          <h2 className="footer-logo">
            <CLMonogram size="0.9em" color="#ff7a3d" stemColor="#ffb38a" />
            <span>ChiliLand</span>
          </h2>
          <p className="footer-tagline">
            {t('footer.tagline')}
          </p>
        </div>

        {/* NAVIGATION */}
        <div className="footer-col">
          <h3>{t('footer.explore')}</h3>
          <ul>
            <li><Link to="/">{t('footer.catalogue')}</Link></li>
            <li><Link to="/tours">{t('footer.tours')}</Link></li>
            <li><Link to="/about">{t('footer.aboutFarm')}</Link></li>
          </ul>
        </div>

        {/* CONTACT */}
        <div className="footer-col">
          <h3>{t('footer.visitUs')}</h3>
          <ul>
            <li>{t('footer.farmName')}</li>
            <li>{t('footer.hours')}</li>
            <li>+972 50-123-4567</li>
            <li>info@chililand.com</li>
          </ul>
        </div>

      </div>

      <div className="visitor-footer-bottom">
        <p>{t('footer.rights', { year: new Date().getFullYear() })}</p>
      </div>
    </footer>
  );
}

export default FooterVisitor;
