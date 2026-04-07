import React from "react";
import "./FooterVisitor.css";

function FooterVisitor() {
  return (
    <footer className="visitor-footer">
      <div className="visitor-footer-inner">
        
        {/* LEFT / BRAND */}
        <div className="footer-col footer-brand">
          <h2 className="footer-logo">ChiliLand</h2>
          <p className="footer-tagline">
            A place to explore, taste, and experience the world of chilli.
          </p>
        </div>

        {/* NAVIGATION */}
        <div className="footer-col">
          <h3>Explore</h3>
          <ul>
            <li><a href="#">Catalogue</a></li>
            <li><a href="#">Tours</a></li>
            <li><a href="#">Workshops</a></li>
          </ul>
        </div>

        {/* CONTACT */}
        <div className="footer-col">
          <h3>Visit Us</h3>
          <ul>
            <li>ChiliLand Farm</li>
            <li>Open daily: 09:00 - 18:00</li>
            <li>+972 50-123-4567</li>
            <li>info@chililand.com</li>
          </ul>
        </div>

      </div>

      <div className="visitor-footer-bottom">
        <p>© {new Date().getFullYear()} ChiliLand. All rights reserved.</p>
      </div>
    </footer>
  );
}

export default FooterVisitor;