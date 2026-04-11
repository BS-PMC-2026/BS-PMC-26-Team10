import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import "../styles/pepperDetailsPage.css";

const API_BASE_URL = "http://127.0.0.1:8000";

function PepperDetailsPage() {
  const { name } = useParams();
  const [pepper, setPepper] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    async function fetchPepperDetails() {
      setIsLoading(true);
      setIsError(false);

      try {
        const response = await fetch(`${API_BASE_URL}/chillies`);

        if (!response.ok) {
          throw new Error("Failed to fetch peppers.");
        }

        const data = await response.json();
        const decodedName = decodeURIComponent(name);

        const matchedPepper = data.find(
          (item) => item.name?.toLowerCase() === decodedName.toLowerCase()
        );

        if (!matchedPepper) {
          setPepper(null);
          setIsError(true);
        } else {
          setPepper(matchedPepper);
        }
      } catch (error) {
        console.error(error);
        setIsError(true);
      } finally {
        setIsLoading(false);
      }
    }

    fetchPepperDetails();
  }, [name]);

  if (isLoading) {
    return (
      <div className="pepper-page">
        <div className="pepper-page-shell">
          <div className="pepper-state-card">Loading pepper details...</div>
        </div>
      </div>
    );
  }

  if (isError || !pepper) {
    return (
      <div className="pepper-page">
        <div className="pepper-page-shell">
          <div className="pepper-state-card">Pepper not found.</div>
        </div>
      </div>
    );
  }

  const customDescription =
    pepper.full_description ||
    "This content is curated from reliable reference sources to provide a richer and more informative overview of each pepper variety.";

  return (
    <div className="pepper-page">
      <div className="pepper-page-shell">
        <Link to="/" className="pepper-back-button">
          <span className="pepper-back-arrow">←</span>
          <span>Back to catalogue</span>
        </Link>

        <section className="pepper-hero-card">
          <div className="pepper-hero-bg pepper-hero-bg-one" />
          <div className="pepper-hero-bg pepper-hero-bg-two" />

          <div className="pepper-hero-left">
            <div className="pepper-image-glow" />
            <div className="pepper-image-frame">
              <img
                src={pepper.image_url}
                alt={pepper.name}
                className="pepper-main-image"
              />
            </div>
          </div>

          <div className="pepper-hero-right">
            <div className="pepper-profile-badge">Pepper spotlight</div>

            <h1 className="pepper-main-title">{pepper.name}</h1>

            <div className="pepper-mini-divider" />

            <div className="pepper-story-card">
              <p className="pepper-story-text">{customDescription}</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default PepperDetailsPage;