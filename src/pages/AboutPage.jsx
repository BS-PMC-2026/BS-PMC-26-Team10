import { Link } from "react-router-dom";
import { Flame, Users, Package, GraduationCap, Sprout, FlaskConical, MapPin, ShoppingCart } from "lucide-react";
import "../styles/AboutPage.css";
import heroImg from "../assets/imgae3.jpeg";

function scrollTo(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

const OFFERS = [
  {
    icon: <Flame size={28} />,
    title: "150+ Pepper Varieties",
    text: "Explore one of the largest collections of hot peppers in the region — from mild and fruity to scorching rare varieties sourced from every corner of the world.",
  },
  {
    icon: <Users size={28} />,
    title: "Guided Farm Tours",
    text: "Walk the growing tunnels with a knowledgeable guide. See the plants up close, learn how each variety is cultivated, and hear the story behind the farm.",
  },
  {
    icon: <Package size={28} />,
    title: "Handcrafted Products",
    text: "Our small-scale production facility turns fresh peppers into hot sauces, chutneys, and spice blends — all made on-site with care and quality.",
  },
  {
    icon: <GraduationCap size={28} />,
    title: "Tasting & Education",
    text: "Compare heat levels on the Scoville scale, taste fresh and processed peppers, and leave with real knowledge about origins, colours, and flavour profiles.",
  },
  {
    icon: <Sprout size={28} />,
    title: "Seeds & Seedlings",
    text: "Take a piece of the farm home. We offer a curated selection of seeds and young seedlings so you can start your own spicy growing journey.",
  },
  {
    icon: <Users size={28} />,
    title: "Family-Friendly Experience",
    text: "An inclusive, outdoor experience designed for all ages — couples, families, and curious solo visitors who want something different from a typical day out.",
  },
];

const WHY_VISIT = [
  "A one-of-a-kind destination — there's nothing quite like it in the region",
  "Real farm, real people, real story behind every plant",
  "Sensory and hands-on — not just another museum visit",
  "Learn something you'll actually use in your kitchen",
  "Supporting a family-run farm with deep personal roots",
];

export default function AboutPage() {
  return (
    <div className="about-page">
      <section className="about-hero">
        <div className="about-hero-layout">
          <div className="about-hero-inner">
            <Link to="/" className="about-back">
              &#8592; Back to Home
            </Link>

            <p className="about-kicker">Hadiners · House of Spicy</p>

            <h1 className="about-hero-title">
              More than a farm.
              <br />A story grown from the ground up.
            </h1>

            <p className="about-hero-sub">
              A living farm, a visitor destination, and a personal journey — all
              in one place. Come explore over 150 varieties of hot peppers and
              discover where passion meets the soil.
            </p>

            <div className="about-hero-actions">
              <Link to="/tours" className="about-btn about-btn--primary">
                Book a Tour
              </Link>

              <button
                className="about-btn about-btn--ghost"
                onClick={() => scrollTo("our-story")}
              >
                Read Our Story
              </button>

              <Link
                to="/farm-location"
                state={{ from: "/about" }}
                className="about-btn about-btn--primary"
              >
                Farm Location
              </Link>
            </div>
          </div>

          <div className="about-hero-image-wrap">
            <img src={heroImg} alt="The Hadiners farm" className="about-hero-img" />
          </div>
        </div>
      </section>

      <section className="about-story" id="our-story">
        <div className="about-section-inner">
          <div className="about-story-grid">
            <div className="about-story-text">
              <p className="about-section-kicker">Our Story</p>
              <h2 className="about-section-title">From grief to growing</h2>

              <p className="about-story-body">
                Life doesn't always follow the path we imagine. For the founder
                of Hadiners, a career in farming was never part of the plan —
                until everything changed.
              </p>

              <p className="about-story-body">
                After losing his beloved nephew Kfir in a car accident, the
                weight of grief pulled him away from the things he once loved.
                For a while, it felt like part of him had gone too. Then
                something unexpected happened.
              </p>

              <p className="about-story-body">
                His eldest son introduced him to a large online community of hot
                pepper enthusiasts. What began as a distraction became a genuine
                passion. He started growing his first plants — slowly, carefully
                — and for the first time in a long while, the smile returned.
              </p>

              <p className="about-story-body">
                That hobby grew into a calling. The growing tunnels expanded. A
                small production kitchen followed. Then a visitor centre. What
                was once a way to heal quietly became a place where others could
                come, explore, taste, and feel at home.
              </p>

              <p className="about-story-body about-story-highlight">
                Today, Hadiners is a farm, a food producer, and a community —
                built by hand, built from loss, and built with love for
                everything spicy.
              </p>
            </div>

            <div className="about-story-aside">
              <div className="about-story-card">
                <div className="about-story-stat">
                  <span className="about-stat-number">150+</span>
                  <span className="about-stat-label">pepper varieties</span>
                </div>

                <div className="about-story-stat">
                  <span className="about-stat-number">4</span>
                  <span className="about-stat-label">farm zones</span>
                </div>

                <div className="about-story-stat">
                  <span className="about-stat-number">1</span>
                  <span className="about-stat-label">family, one dream</span>
                </div>
              </div>

              <blockquote className="about-quote">
                "What started as a way to heal quietly became a place where
                others could feel at home too."
              </blockquote>
            </div>
          </div>
        </div>
      </section>

      <section className="about-offers">
        <div className="about-section-inner">
          <p className="about-section-kicker">What We Offer</p>
          <h2 className="about-section-title">A full day of spicy discovery</h2>

          <p className="about-section-sub">
            Whether you're a seasoned chilli lover or curious for the first time,
            there's something here for you.
          </p>

          <div className="about-offers-grid">
            {OFFERS.map((item) => (
              <article key={item.title} className="about-offer-card">
                <div className="about-offer-icon">{item.icon}</div>
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
              The Visitor Experience
            </p>

            <h2 className="about-section-title about-section-title--light">
              Step inside a world of heat and flavour
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
            <div className="about-experience-badge">
              <span className="about-experience-badge-icon"><Flame size={20} /></span>
              <span>Field walk included in every tour</span>
            </div>

            <div className="about-experience-badge">
              <span className="about-experience-badge-icon"><FlaskConical size={20} /></span>
              <span>Live Scoville tastings</span>
            </div>

            <div className="about-experience-badge">
              <span className="about-experience-badge-icon"><MapPin size={20} /></span>
              <span>Small groups — personal attention</span>
            </div>

            <div className="about-experience-badge">
              <span className="about-experience-badge-icon"><ShoppingCart size={20} /></span>
              <span>Farm shop open after every tour</span>
            </div>
          </div>
        </div>
      </section>

      <section className="about-why">
        <div className="about-section-inner">
          <p className="about-section-kicker">Why Visit Us</p>
          <h2 className="about-section-title">A place unlike any other</h2>

          <ul className="about-why-list">
            {WHY_VISIT.map((item) => (
              <li key={item} className="about-why-item">
                <span className="about-why-check">✓</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="about-closing">
        <div className="about-closing-inner">
          <h2 className="about-closing-title">You're welcome here</h2>

          <p className="about-closing-text">
            Hadiners was built as a place of passion, healing, and community.
            Whatever brings you — curiosity, love of food, a family outing, or
            just a great day out — you'll find your place among the peppers. Come
            as a visitor. Leave as part of the story.
          </p>

          <Link to="/tours" className="about-btn about-btn--primary about-btn--large">
            View Tours &amp; Book Your Visit
          </Link>
        </div>
      </section>
    </div>
  );
}