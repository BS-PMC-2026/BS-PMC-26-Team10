import "../styles/visitorMain.css";

// components
import HeaderVisitor from "/src/components/HeaderVisitor/HeaderVisitor";
import WelcomeStrip from "/src/components/WelcomeStrip/WelcomeStrip";
import VisitorCatalogue from "/src/components/VisitorCatalogue/VisitorCatalogue";
// import WhyVisitUs from "/src/components/WhyVisitUs/WhyVisitUs";
import FooterVisitor from "/src/components/FooterVisitor/FooterVisitor";

function VisitorMain() {
  return (
    <>
      <HeaderVisitor />
      <WelcomeStrip />
      <VisitorCatalogue />
      {/* <WhyVisitUs /> */}
      <FooterVisitor />
    </>
  );
}

export default VisitorMain;