import { useWelcomeStore } from "@/stores/useWelcomeStore";

export const WelcomeGradient = () => {
  const { setWelcome, welcome, setHovering } = useWelcomeStore();

  if (!welcome) return null;

  return (
    <div className="absolute top-[calc(40%-8rem)] z-[60] flex h-32 w-full flex-row justify-center bg-gradient-to-b from-transparent to-white">
      <div
        className="h-32 w-[317px] cursor-pointer md:w-[392.42px]"
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        onClick={() => setWelcome(false)}
      />
    </div>
  );
};
