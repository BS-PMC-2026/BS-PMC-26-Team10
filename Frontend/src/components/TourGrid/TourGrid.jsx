import TourCard from "../TourCard/TourCard";
import "./TourGrid.css";

function TourGrid({ tours, onEdit, onDelete }) {
  return (
    <div className="tour-grid">
      {tours.map((tour) => (
        <TourCard key={tour.id} tour={tour} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </div>
  );
}

export default TourGrid;
