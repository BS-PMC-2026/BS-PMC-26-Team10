import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { MapPin, Tractor, ShoppingBag, Camera, Car, Compass, Bus, Phone, Mail, Flame } from "lucide-react";
import "../styles/FarmLocation.css";
import SocialLinks from "../components/SocialLinks/SocialLinks";
import farmImageOne from "../assets/imgae1.jpeg";
import farmImageTwo from "../assets/image6.jpeg";
import farmImageThree from "../assets/image7.jpeg";

function FarmLocation() {
  const { t } = useTranslation();
  const location = useLocation();
  const backTo = location.state?.from || "/";

  const farmAddress = "הדינרים בית של חריף, דקל 43, פרי גן";

  const googleMapsUrl =
    "https://www.google.com/maps/search/?api=1&query=" +
    encodeURIComponent(farmAddress);

  const wazeUrl =
    "https://waze.com/ul?q=" + encodeURIComponent(farmAddress) + "&navigate=yes";

  const embedMapUrl =
    "https://www.google.com/maps?q=" +
    encodeURIComponent(farmAddress) +
    "&output=embed";

  const farmImages = [
    farmImageOne,
    farmImageTwo,
    farmImageThree,
  ];

  const awaits = t('location.awaits', { returnObjects: true });
  const howItems = t('location.howItems', { returnObjects: true });

  return (
    <div className="farm-location-page">
      <div className="farm-location-container">
        <Link to={backTo} className="farm-back-btn">
          {t('location.back')}
        </Link>

        <section className="farm-location-hero">
          <div className="farm-hero-content">
            <div className="farm-location-badge">{t('location.badge')}</div>

            <h1>{t('location.title')}</h1>

            <p>{t('location.subtitle')}</p>

            <div className="farm-address-box"><MapPin size={16} style={{display:'inline',marginInlineEnd:6}} />{farmAddress}</div>

            <div className="farm-location-actions">
              <a href={googleMapsUrl} target="_blank" rel="noreferrer" className="farm-location-btn primary">
                {t('location.openMaps')}
              </a>
              <a href={wazeUrl} target="_blank" rel="noreferrer" className="farm-location-btn secondary">
                {t('location.openWaze')}
              </a>
            </div>
          </div>

          <div className="farm-visit-card">
            <h3>{t('location.awaitsTitle')}</h3>
            <ul>
              <li><Flame size={14} style={{display:'inline',marginInlineEnd:6}} />{awaits[0]}</li>
              <li><Tractor size={14} style={{display:'inline',marginInlineEnd:6}} />{awaits[1]}</li>
              <li><ShoppingBag size={14} style={{display:'inline',marginInlineEnd:6}} />{awaits[2]}</li>
              <li><Camera size={14} style={{display:'inline',marginInlineEnd:6}} />{awaits[3]}</li>
            </ul>
          </div>
        </section>

        <section className="farm-map-section">
          <div className="farm-map-header">
            <div>
              <h2>{t('location.findTitle')}</h2>
              <p>{t('location.findSubtitle')}</p>
            </div>
            <div className="farm-map-tag"><MapPin size={14} style={{display:'inline',marginInlineEnd:4}} />{t('location.mapTag')}</div>
          </div>

          <div className="farm-map-wrapper">
            <iframe
              title="Farm Location"
              src={embedMapUrl}
              width="100%"
              height="420"
              style={{ border: 0 }}
              loading="lazy"
              allowFullScreen
            />
          </div>
        </section>

        <section className="farm-gallery-section">
          <div className="farm-gallery-header">
            <h2>{t('location.galleryTitle')}</h2>
            <p>{t('location.gallerySubtitle')}</p>
          </div>

          <div className="farm-gallery-grid">
            {farmImages.map((img, i) => (
              <div key={i} className="farm-gallery-card">
                <img src={img} alt={t('location.galleryImgAlt', { n: i + 1 })} />
              </div>
            ))}
          </div>
        </section>

        <section className="farm-info-section">
          <div className="farm-info-card">
            <h2>{t('location.howTitle')}</h2>
            <ul>
              <li><Car size={14} style={{display:'inline',marginInlineEnd:6}} />{howItems[0]}</li>
              <li><Compass size={14} style={{display:'inline',marginInlineEnd:6}} />{howItems[1]}</li>
              <li><Bus size={14} style={{display:'inline',marginInlineEnd:6}} />{howItems[2]}</li>
            </ul>
          </div>

          <div className="farm-info-card contact">
            <h2>{t('location.helpTitle')}</h2>
            <p>{t('location.helpDesc')}</p>
            <div className="contact-item"><Phone size={14} style={{display:'inline',marginInlineEnd:6}} />052-324-4448</div>
            <div className="contact-item"><Mail size={14} style={{display:'inline',marginInlineEnd:6}} />SPICYDINARS@GMAIL.COM</div>
            <div className="contact-social">
              <SocialLinks variant="inline" />
            </div>
            <Link to="/contact" className="farm-contact-btn">
              {t('location.contactBtn')}
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

export default FarmLocation;
