import "../styles/VisitorMain.css";

// components
import HeaderVisitor from "/src/components/HeaderVisitor/HeaderVisitor";
import WelcomeStrip from "/src/components/WelcomeStrip/WelcomeStrip";
import VisitorCatalogue from "/src/components/VisitorCatalogue/VisitorCatalogue";
// import WhyVisitUs from "/src/components/WhyVisitUs/WhyVisitUs";
import FooterVisitor from "/src/components/FooterVisitor/FooterVisitor";
import SocialLinks from "/src/components/SocialLinks/SocialLinks";
import UpdateSubscription from "/src/components/UpdateSubscription/UpdateSubscription";

function VisitorMain() {
  return (
    <>
      <SocialLinks variant="floating" />
      <HeaderVisitor />
      <WelcomeStrip />
      <div id="products"><VisitorCatalogue /></div>
      {/* <WhyVisitUs /> */}
      <UpdateSubscription />
      <FooterVisitor />
    </>
  );
}

export default VisitorMain;
