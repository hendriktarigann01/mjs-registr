import Image from "next/image";

export default function Header() {
  return (
    <div className="w-full flex items-center justify-center">
      <Image
        src="/karindo_logo_text.png"
        alt="Logo Karindo"
        width={160}
        height={60}
        className="h-8 w-auto"
      />
    </div>
  );
}
