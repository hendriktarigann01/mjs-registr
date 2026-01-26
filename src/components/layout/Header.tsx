import Image from "next/image";

export default function Header() {
  return (
    <div className="w-full flex items-center justify-center">
      <Image
        src="/mjs_logo_text.png"
        alt="MJ Solution"
        width={120}
        height={40}
        className="h-8 w-auto"
      />
    </div>
  );
}
