import { BrowserRouter, Routes, Route } from "react-router-dom";
import Auth from "./pages/Auth";
import VisitorMain from "./pages/VisitorMain";
import OwnerMain from "./pages/OwnerMain";
import TourguideMain from "./pages/TourguideMain";
import PepperDetailsPage from "./pages/PepperDetailsPage";
import OwnerInventory from "./pages/OwnerInventory";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<VisitorMain />} />
        <Route path="/owner" element={<OwnerMain />} />
        <Route path="/owner/inventory" element={<OwnerInventory />} />
        <Route path="/tourguide" element={<TourguideMain />} />
        <Route path="/staffLogin" element={<Auth />} />
        <Route path="/pepper/:id" element={<PepperDetailsPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;