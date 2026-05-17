import React from "react";
import { Link, useLocation } from "react-router-dom";
import { MapPin, Tractor, ShoppingBag, Camera, Car, Compass, Bus, Phone, Mail, Flame, Users, GraduationCap } from "lucide-react";
import "../styles/FarmLocation.css";

function FarmLocation() {
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
    "/chilli_images/aji_fantasy.jpeg",
    "/chilli_images/cherry_bomb_orange.jpg",
    "/chilli_images/naga.jpg",
  ];

  return (
    <div className="farm-location-page">
      <div className="farm-location-container">
        <Link to={backTo} className="farm-back-btn">
          ← Back
        </Link>

        <section className="farm-location-hero">
          <div className="farm-hero-content">
            <div className="farm-location-badge">Plan Your Visit</div>

            <h1>Visit ChiliLand Farm</h1>

            <p>
              Experience the world of chili peppers, guided tours, tastings and
              a warm farm atmosphere. Find us easily and start your journey.
            </p>

            <div className="farm-address-box"><MapPin size={16} style={{display:'inline',marginRight:6}} />{farmAddress}</div>

            <div className="farm-location-actions">
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noreferrer"
                className="farm-location-btn primary"
              >
                Open in Google Maps
              </a>

              <a
                href={wazeUrl}
                target="_blank"
                rel="noreferrer"
                className="farm-location-btn secondary"
              >
                Navigate with Waze
              </a>
            </div>
          </div>

          <div className="farm-visit-card">
            <h3>What Awaits You</h3>
            <ul>
              <li><Flame size={14} style={{display:'inline',marginRight:6}} />Chili tasting experience</li>
              <li><Tractor size={14} style={{display:'inline',marginRight:6}} />Guided farm tours</li>
              <li><ShoppingBag size={14} style={{display:'inline',marginRight:6}} />Unique chili products</li>
              <li><Camera size={14} style={{display:'inline',marginRight:6}} />Authentic farm atmosphere</li>
            </ul>
          </div>
        </section>

        <section className="farm-map-section">
          <div className="farm-map-header">
            <div>
              <h2>Find Us Easily</h2>
              <p>Use the map below to locate the farm before your visit.</p>
            </div>

            <div className="farm-map-tag"><MapPin size={14} style={{display:'inline',marginRight:4}} />Pri Gan, Israel</div>
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
            <h2>Chili Experience</h2>
            <p>Explore some of the peppers grown on our farm.</p>
          </div>

          <div className="farm-gallery-grid">
            {farmImages.map((img, i) => (
              <div key={i} className="farm-gallery-card">
                <img src={img} alt={`ChiliLand pepper ${i + 1}`} />
              </div>
            ))}
          </div>
        </section>

        <section className="farm-info-section">
          <div className="farm-info-card">
            <h2>How to Get Here</h2>

            <ul>
              <li><Car size={14} style={{display:'inline',marginRight:6}} />Free parking available near the farm</li>
              <li><Compass size={14} style={{display:'inline',marginRight:6}} />Recommended: use Waze or Google Maps</li>
              <li><Bus size={14} style={{display:'inline',marginRight:6}} />Bus: Line 12, &quot;Prigan Center&quot; stop — about 5 min walk</li>
            </ul>
          </div>

          <div className="farm-info-card contact">
            <h2>Need Help?</h2>

            <p>If you have trouble finding us, feel free to contact:</p>

            <div className="contact-item"><Phone size={14} style={{display:'inline',marginRight:6}} />052-324-4448</div>
            <div className="contact-item"><Mail size={14} style={{display:'inline',marginRight:6}} />SPICYDINARS@GMAIL.COM</div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default FarmLocation;