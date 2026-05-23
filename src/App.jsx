import { BrowserRouter, Routes, Route, useLocation, Outlet } from "react-router-dom";
import { useEffect } from "react";
import Navbar from "./components/Navbar/Navbar";
import Auth from "./pages/Auth";
import VisitorMain from "./pages/VisitorMain";
import OwnerMain from "./pages/OwnerMain";
import TourguideMain from "./pages/TourguideMain";
import PepperDetailsPage from "./pages/PepperDetailsPage";
import ToursPage from "./pages/ToursPage";
import TourDetailPage from "./pages/TourDetailPage";
import AboutPage from "./pages/AboutPage";
import FarmLocation from "./pages/FarmLocation";
import VisitorProducts from "./pages/VisitorProducts";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function VisitorLayout() {
  return (
    <>
      <Navbar />
      <Outlet />
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route element={<VisitorLayout />}>
          <Route path="/" element={<VisitorMain />} />
          <Route path="/products" element={<VisitorProducts />} />
          <Route path="/pepper/:id" element={<PepperDetailsPage />} />
          <Route path="/tours" element={<ToursPage />} />
          <Route path="/tours/:id" element={<TourDetailPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/farm-location" element={<FarmLocation />} />
        </Route>
        <Route path="/owner" element={<OwnerMain />} />
        <Route path="/owner/:section" element={<OwnerMain />} />
        <Route path="/tourguide" element={<TourguideMain />} />
        <Route path="/staffLogin" element={<Auth />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
