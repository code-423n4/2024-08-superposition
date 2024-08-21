"use client";

import { motion, useMotionValue, useTransform } from "framer-motion";
import styles from "./Slider.module.scss";
import { useEffect, useRef, useState } from "react";

interface ISlider {
  onSlideComplete: () => void;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

const Index: React.FC<ISlider> = (props) => {
  const { children, onSlideComplete, disabled = false } = props;

  const containerRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);

  const [dragComplete, setDragComplete] = useState(false);
  const [width, setWidth] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (!containerRef.current) return;
    setWidth(containerRef.current.offsetWidth);
  }, [containerRef]);

  const arrowOpacity = useTransform(x, [0, (width || 0) - 32], [1, 0]);

  const classes = `
    ${styles.SliderButton}
    ${disabled ? styles.disabled : ""}
    ${dragComplete ? styles.complete : ""}
    ${props.className}
  `;
  useEffect(() => {
    if (dragComplete && !disabled) setDragComplete(false);
  }, [dragComplete, disabled]);

  return (
    <div className={styles.Box}>
      <motion.div className={classes} ref={containerRef}>
        {!dragComplete && (
          <motion.div
            className={styles.draggable}
            drag="x"
            style={{ x, cursor: "grab" }}
            dragElastic={0.1}
            dragSnapToOrigin
            dragMomentum={false}
            dragConstraints={containerRef}
            onDragEnd={(event, info) => {
              if (!width) return;
              if (info.offset.x >= width - 32) {
                setDragComplete(true);
                onSlideComplete();
              }
            }}
          >
            <div className={styles.track} />
            {!dragComplete && (
              <div className={styles.thumb}>
                <motion.div style={{ opacity: arrowOpacity }}>-&gt;</motion.div>
              </div>
            )}
          </motion.div>
        )}
        <motion.div className={styles.content}>{children}</motion.div>
      </motion.div>
    </div>
  );
};

export default Index;
