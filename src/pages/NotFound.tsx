import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { DeskChrome } from "@/components/live/DeskChrome";
import { usePageTitle } from "@/hooks/usePageTitle";

const NotFound = () => {
  const location = useLocation();
  usePageTitle("Not on the desk — STANS");

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <DeskChrome section="desk">
      <main id="page-main" className="reading grid min-h-[60vh] content-center">
        <p className="eyebrow">404</p>
        <h1 className="mt-3 text-5xl sm:text-6xl">This page is not on the desk.</h1>
        <p className="reading-prose mt-5 text-lg text-muted-foreground">The map is still there. The address you opened is not.</p>
        <Link to="/" className="desk-btn mt-8 w-fit px-5">
          Back to the map
        </Link>
      </main>
    </DeskChrome>
  );
};

export default NotFound;
