import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Flame, Users, Package, GraduationCap, Sprout, FlaskConical, MapPin, ShoppingCart } from "lucide-react";
import "../styles/AboutPage.css";
import heroImg from "../assets/imgae3.jpeg";

function scrollTo(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

const OFFER_ICONS = [
  <Flame size={28} />,
  <Users size={28} />,
  <Package size={28} />,
  <GraduationCap size={28} />,
  <Sprout size={28} />,
  <Users size={28} />,
];

const EXPERIENCE_ICONS = [
  <Flame size={20} />,
  <FlaskConical size={20} />,
  <MapPin size={20} />,
  <ShoppingCart size={20} />,
];

export default function AboutPage() {
  const { t } = useTranslation();

  const OFFERS = t('about.offers', { returnObjects: true });
  const WHY_VISIT = t('about.whyVisit', { returnObjects: true });
  const experiencePoints = t('about.experiencePoints', { returnObjects: true });

  return (
    <div className="about-page">
      <section className="about-hero">
        <div className="about-hero-layout">
          <div className="about-hero-inner">
            <Link to="/" className="about-back">
              {t('about.backHome')}
            </Link>

            <p className="about-kicker">{t('about.kicker')}</p>

            <h1 className="about-hero-title">
              {t('about.title').split('\n').map((line, i, arr) => (
                i < arr.length - 1 ? <span key={i}>{line}<br /></span> : <span key={i}>{line}</span>
              ))}
            </h1>

            <p className="about-hero-sub">
              {t('about.subtitle')}
            </p>

            <div className="about-hero-actions">
              <Link to="/tours" className="about-btn about-btn--primary">
                {t('about.btnTour')}
              </Link>

              <button
                className="about-btn about-btn--ghost"
                onClick={() => scrollTo("our-story")}
              >
                {t('about.btnStory')}
              </button>

              <Link
                to="/farm-location"
                state={{ from: "/about" }}
                className="about-btn about-btn--primary"
              >
                {t('about.btnLocation')}
              </Link>
            </div>
          </div>

          <div className="about-hero-image-wrap">
            <img src={heroImg} alt={t('about.heroImgAlt')} className="about-hero-img" />
          </div>
        </div>
      </section>

      <section className="about-story" id="our-story">
        <div className="about-section-inner">
          <div className="about-story-grid">
            <div className="about-story-text">
              <p className="about-section-kicker">{t('about.storyKicker')}</p>
              <h2 className="about-section-title">{t('about.storyTitle')}</h2>

              <p className="about-story-body">
                {t('about.storyBody1')}
              </p>

              <p className="about-story-body">
                {t('about.storyBody2')}
              </p>

              <p className="about-story-body">
                {t('about.storyBody3')}
              </p>

              <p className="about-story-body">
                {t('about.storyBody4')}
              </p>

              <p className="about-story-body about-story-highlight">
                {t('about.storyBody5')}
              </p>
            </div>

            <div className="about-story-aside">
              <div className="about-story-card">
                <div className="about-story-stat">
                  <span className="about-stat-number">{t('about.stat1Value')}</span>
                  <span className="about-stat-label">{t('about.stat1Label')}</span>
                </div>

                <div className="about-story-stat">
                  <span className="about-stat-number">{t('about.stat2Value')}</span>
                  <span className="about-stat-label">{t('about.stat2Label')}</span>
                </div>

                <div className="about-story-stat">
                  <span className="about-stat-number">{t('about.stat3Value')}</span>
                  <span className="about-stat-label">{t('about.stat3Label')}</span>
                </div>
              </div>

              <blockquote className="about-quote">
                {t('about.quote')}
              </blockquote>
            </div>
          </div>
        </div>
      </section>

      <section className="about-offers">
        <div className="about-section-inner">
          <p className="about-section-kicker">{t('about.offersKicker')}</p>
          <h2 className="about-section-title">{t('about.offersTitle')}</h2>

          <p className="about-section-sub">
            {t('about.offersSubtitle')}
          </p>

          <div className="about-offers-grid">
            {OFFERS.map((item, i) => (
              <article key={item.title} className="about-offer-card">
                <div className="about-offer-icon">{OFFER_ICONS[i]}</div>
                <h3 className="about-offer-title">{item.title}</h3>
                <p className="about-offer-text">{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="about-experience">
        <div className="about-section-inner about-experience-inner">
          <div className="about-experience-text">
            <p className="about-section-kicker about-section-kicker--light">
              {t('about.experienceKicker')}
            </p>

            <h2 className="about-section-title about-section-title--light">
              {t('about.experienceTitle')}
            </h2>

            <p className="about-experience-body">
              A visit to Hadiners is immersive from the moment you arrive. You'll
              walk through growing tunnels packed with colour — deep reds, bright
              oranges, yellows, and purples — each variety with its own
              personality and story.
            </p>

            <p className="about-experience-body">
              Your guide will walk you through different heat levels using the
              Scoville scale, explain where each pepper originates, and help you
              understand what makes every variety unique. Tastings are part of
              every tour — from mild and fruity to genuinely scorching.
            </p>

            <p className="about-experience-body">
              The farm is open to all — families, couples, groups, and solo
              explorers. Each visit is hands-on, educational, and genuinely fun.
            </p>
          </div>

          <div className="about-experience-visual">
            {experiencePoints.map((point, i) => (
              <div key={i} className="about-experience-badge">
                <span className="about-experience-badge-icon">{EXPERIENCE_ICONS[i]}</span>
                <span>{point}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="about-why">
        <div className="about-section-inner">
          <p className="about-section-kicker">{t('about.whyKicker')}</p>
          <h2 className="about-section-title">{t('about.whyTitle')}</h2>

          <ul className="about-why-list">
            {WHY_VISIT.map((item, i) => (
              <li key={i} className="about-why-item">
                <span className="about-why-check">✓</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="about-closing">
        <div className="about-closing-inner">
          <h2 className="about-closing-title">{t('about.ctaText')}</h2>

          <p className="about-closing-text">
            {t('about.ctaBody')}
          </p>

          <Link to="/tours" className="about-btn about-btn--primary about-btn--large">
            {t('about.ctaBtn')}
          </Link>
        </div>
      </section>
    </div>
  );
}
