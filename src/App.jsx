import { BrowserRouter, Routes, Route } from "react-router-dom";
import Auth from "./pages/Auth";
import VisitorMain from "./pages/VisitorMain";
import OwnerMain from "./pages/OwnerMain";
import TourguideMain from "./pages/TourguideMain";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        
        <Route path="/" element={<VisitorMain />} />
        <Route path="/owner" element={<OwnerMain />} />
        <Route path="/tourguide" element={<TourguideMain />} />
        <Route path="/staffLogin" element={<Auth />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;