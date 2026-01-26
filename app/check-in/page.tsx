import QRScanner from "@/components/QRScanner";

export const metadata = {
  title: "Check-in - Scan QR Code",
  description: "Scan QR code untuk check-in peserta",
};

export default function CheckInPage() {
  return <QRScanner />;
}
