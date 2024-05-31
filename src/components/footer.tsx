import Link from "next/link";
import Image from "next/image";
import "tailwindcss/tailwind.css";
const Footer = () => {
  return (
    <div
      className="fixed bottom-0 left-0 w-full backdrop-blur-md z-50 font-sans"
      style={{
        WebkitBackdropFilter: "blur(12px)",
      }}
    >
      <footer className="sticky bottom-0 w-full max-w-360 mx-auto flex items-end justify-center gap-2 pb-6 px-4 h-20">
        <span className="text-xl font-bold text-white">Inspired By</span>
        <Link
          href="https://suifrens.com/"
          className="xl:hover:button-animate-105"
        >
          <Image
            className="h-full"
            src="/frens/SuiFrenslogo.svg"
            alt="logo"
            width={120}
            height={32}
          />
        </Link>
      </footer>
    </div>
  );
};

export default Footer;
