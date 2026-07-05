import UploadView from "@/components/upload/UploadView";
import Logo from "@/components/ui/Logo";

export default function UploadPage() {
  return (
    <div className="md-page-bg" style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
      <div className="md-grid-bg" />
      <div style={{ position: "absolute", top: 24, left: 32, zIndex: 2 }}>
        <Logo size={30} />
      </div>
      <div style={{ position: "relative", zIndex: 2, width: "100%", display: "flex", justifyContent: "center" }}>
        <UploadView />
      </div>
    </div>
  );
}
