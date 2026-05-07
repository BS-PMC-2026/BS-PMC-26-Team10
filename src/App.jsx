import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}
import Auth from "./pages/Auth";
import VisitorMain from "./pages/VisitorMain";
import OwnerMain from "./pages/OwnerMain";
import TourguideMain from "./pages/TourguideMain";
import PepperDetailsPage from "./pages/PepperDetailsPage";
import OwnerInventory from "./pages/OwnerInventory";
import OwnerOrders from "./pages/OwnerOrders";
import ToursPage from "./pages/ToursPage";
import TourDetailPage from "./pages/TourDetailPage";
import AboutPage from "./pages/AboutPage";
import FarmLocation from "./pages/FarmLocation";
import VisitorProducts from "./pages/VisitorProducts";
import OwnerChillies from "./pages/OwnerChillies";
import OwnerPromoCodes from "./pages/OwnerPromoCodes";

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/owner/orders" element={<OwnerOrders />} />
        <Route path="/" element={<VisitorMain />} />
        <Route path="/products" element={<VisitorProducts />} />
        <Route path="/owner" element={<OwnerMain />} />
        <Route path="/owner/inventory" element={<OwnerInventory />} />
        <Route path="/owner/chillies" element={<OwnerChillies />} />
        <Route path="/owner/promo-codes" element={<OwnerPromoCodes />} />
        <Route path="/tourguide" element={<TourguideMain />} />
        <Route path="/staffLogin" element={<Auth />} />
        <Route path="/pepper/:id" element={<PepperDetailsPage />} />
        <Route path="/tours" element={<ToursPage />} />
        <Route path="/tours/:id" element={<TourDetailPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/farm-location" element={<FarmLocation />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;