import { CardNetwork } from "@/context/AppContext";

const CardNetworkLogo = ({ network, className = "" }: { network: CardNetwork; className?: string }) => {
  switch (network) {
    case "visa":
      return (
        <svg viewBox="0 0 780 500" className={className} fill="none">
          <path d="M293.2 348.7l33.4-195.8h53.4l-33.4 195.8h-53.4zm246.8-191c-10.6-4-27.2-8.3-47.9-8.3-52.8 0-90 26.6-90.3 64.6-.3 28.1 26.5 43.8 46.7 53.2 20.8 9.6 27.7 15.7 27.6 24.3-.1 13.1-16.6 19.1-31.9 19.1-21.3 0-32.6-3-50.2-10.3l-6.9-3.1-7.5 43.8c12.5 5.4 35.5 10.2 59.5 10.4 56.2 0 92.7-26.3 93.1-66.8.2-22.3-14-39.2-44.8-53.2-18.6-9.1-30-15.1-29.9-24.3 0-8.1 9.7-16.8 30.5-16.8 17.4-.3 30.1 3.5 39.9 7.5l4.8 2.3 7.3-42.3zm137.3-4.8h-41.3c-12.8 0-22.4 3.5-28 16.3l-79.4 179.5h56.2s9.2-24.1 11.3-29.4c6.1 0 60.8.1 68.6.1 1.6 6.9 6.5 29.3 6.5 29.3h49.7l-43.6-195.8zm-65.9 126.4c4.4-11.3 21.4-54.8 21.4-54.8-.3.5 4.4-11.4 7.1-18.8l3.6 17s10.3 47 12.5 56.6h-44.6zM248.7 152.9l-52.3 133.6-5.6-27.1c-9.7-31.2-39.9-65.1-73.7-82l47.9 171.2 56.6-.1 84.2-195.6h-57.1z" fill="white"/>
          <path d="M124.7 152.9H39.5l-.7 4c67.2 16.2 111.7 55.4 130.1 102.5l-18.8-90.1c-3.2-12.4-12.7-16-25.4-16.4z" fill="rgba(255,255,255,0.7)"/>
        </svg>
      );
    case "mastercard":
      return (
        <svg viewBox="0 0 780 500" className={className}>
          <circle cx="330" cy="250" r="140" fill="rgba(255,255,255,0.6)"/>
          <circle cx="450" cy="250" r="140" fill="rgba(255,255,255,0.4)"/>
        </svg>
      );
    case "humo":
      return (
        <div className={`font-bold text-white tracking-wider ${className}`}>
          <span className="text-lg font-extrabold">HUMO</span>
        </div>
      );
    case "uzcard":
      return (
        <div className={`font-bold text-white tracking-wider ${className}`}>
          <span className="text-lg font-extrabold">UzCard</span>
        </div>
      );
    default:
      return null;
  }
};

export default CardNetworkLogo;
