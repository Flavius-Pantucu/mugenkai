import { Outlet } from "react-router";
import { Navbar } from "../components/Navbar";
import { CustomCursor } from "../components/CustomCursor";

export function MainLayout() {
  return (
    <div className="min-h-screen bg-[#09090b]">
      <CustomCursor />
      <Navbar />
      <main>
        <Outlet />
      </main>
    </div>
  );
}