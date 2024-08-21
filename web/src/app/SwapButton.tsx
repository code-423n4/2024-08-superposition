import Swap from "@/assets/icons/Swap.svg";
import { motion } from "framer-motion";

export const SwapButton = ({ onClick }: { onClick?: () => void }) => (
  <motion.div
    whileHover={{
      borderRadius: 32,
      transition: {
        duration: 0.6,
      },
    }}
    initial={{
      borderRadius: 4,
    }}
    animate={{
      borderRadius: 4,
      transition: {
        duration: 0.6,
      },
    }}
    whileTap={{ scale: 0.9 }}
    className="z-10 flex size-[40px] cursor-pointer items-center justify-center bg-white"
    onClick={onClick}
  >
    <Swap className="h-[17px] w-[11px]" />
  </motion.div>
);
