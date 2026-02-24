"use client";

import CameraScan from "@/components/mode/CameraScan";
import BarcodeScan from "@/components/mode/BarcodeScan";

export default function QRScanner() {
  const scannerMode = process.env.NEXT_PUBLIC_APP_SCANNER;

  if (scannerMode === "CAMERA") {
    return <CameraScan />;
  }

  // Default to BARCODE mode
  return <BarcodeScan />;
}
