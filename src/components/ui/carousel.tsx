"use client";
import React, { useState, useRef, useId, useEffect, useCallback } from "react";
import { IconArrowNarrowRight, IconArrowNarrowLeft } from "@tabler/icons-react";

export interface SlideData {
  title: string;
  button: string;
  src: string;
}

interface SlideProps {
  slide: SlideData;
  index: number;
  current: number;
  handleSlideClick: (index: number) => void;
}

const Slide = ({ slide, index, current, handleSlideClick }: SlideProps) => {
  const slideRef = useRef<HTMLLIElement>(null);
  const xRef = useRef(0);
  const yRef = useRef(0);
  const frameRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const animate = () => {
      if (!slideRef.current) return;
      const x = xRef.current;
      const y = yRef.current;
      slideRef.current.style.setProperty("--x", `${x}px`);
      slideRef.current.style.setProperty("--y", `${y}px`);
      frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  const handleMouseMove = (event: React.MouseEvent) => {
    const el = slideRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    xRef.current = event.clientX - (r.left + Math.floor(r.width / 2));
    yRef.current = event.clientY - (r.top + Math.floor(r.height / 2));
  };

  const handleMouseLeave = () => {
    xRef.current = 0;
    yRef.current = 0;
  };

  const imageLoaded = (event: React.SyntheticEvent<HTMLImageElement>) => {
    event.currentTarget.style.opacity = "1";
  };

  const { src, button, title } = slide;
  const isCurrent = current === index;

  return (
    <div className="[perspective:1200px] [transform-style:preserve-3d] flex-shrink-0">
      <li
        ref={slideRef}
        className="flex flex-1 flex-col items-center justify-center relative text-center text-white opacity-100 transition-all duration-300 ease-in-out w-[70vmin] h-[70vmin] mx-[2vmin] z-10 cursor-pointer list-none"
        onClick={() => handleSlideClick(index)}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          transform: !isCurrent
            ? "scale(0.95) rotateX(8deg)"
            : "scale(1) rotateX(0deg)",
          transition: "transform 0.5s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.4s ease",
          transformOrigin: "bottom",
          opacity: isCurrent ? 1 : 0.6,
        }}
      >
        <div
          className="absolute top-0 left-0 w-full h-full bg-[#1D1F2F] rounded-2xl overflow-hidden transition-all duration-150 ease-out shadow-2xl"
          style={{
            transform: isCurrent
              ? "translate3d(calc(var(--x) / 30), calc(var(--y) / 30), 0)"
              : "none",
          }}
        >
          <img
            className="absolute inset-0 w-[120%] h-[120%] object-cover opacity-100 transition-opacity duration-600 ease-in-out"
            style={{
              opacity: isCurrent ? 1 : 0.5,
            }}
            alt={title}
            src={src}
            onLoad={imageLoaded}
            loading="eager"
            decoding="sync"
          />
          {isCurrent && (
            <div className="absolute inset-0 bg-black/30 transition-all duration-1000" />
          )}
        </div>

        <article
          className={`relative p-[4vmin] transition-opacity duration-1000 ease-in-out ${
            isCurrent ? "opacity-100 visible" : "opacity-0 invisible"
          }`}
        >
          <h2 className="text-lg md:text-2xl lg:text-4xl font-semibold relative">
            {title}
          </h2>
          <div className="flex justify-center">
            <button className="mt-6 px-4 py-2 w-fit mx-auto sm:text-sm text-black bg-white h-12 border border-transparent text-xs flex justify-center items-center rounded-2xl hover:shadow-lg transition duration-200 shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.1),0px_1px_0px_0px_rgba(25,28,33,0.02),0px_0px_0px_1px_rgba(25,28,33,0.08)]">
              {button}
            </button>
          </div>
        </article>
      </li>
    </div>
  );
};

export const CarouselCustomSlide = ({
  children,
  index,
  current,
  handleSlideClick,
  cardWidth,
}: {
  children: React.ReactNode;
  index: number;
  current: number;
  handleSlideClick: (index: number) => void;
  cardWidth?: number;
}) => {
  const slideRef = useRef<HTMLLIElement>(null);
  const xRef = useRef(0);
  const yRef = useRef(0);
  const frameRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const animate = () => {
      if (!slideRef.current) return;
      const x = xRef.current;
      const y = yRef.current;
      slideRef.current.style.setProperty("--x", `${x}px`);
      slideRef.current.style.setProperty("--y", `${y}px`);
      frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  const handleMouseMove = (event: React.MouseEvent) => {
    const el = slideRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    xRef.current = event.clientX - (r.left + Math.floor(r.width / 2));
    yRef.current = event.clientY - (r.top + Math.floor(r.height / 2));
  };

  const handleMouseLeave = () => {
    xRef.current = 0;
    yRef.current = 0;
  };

  const isCurrent = current === index;

  return (
    <div
      className="[perspective:1200px] [transform-style:preserve-3d] flex-shrink-0"
      style={{ width: cardWidth ? `${cardWidth}px` : "clamp(300px, 80vw, 380px)" }}
    >
      <li
        ref={slideRef}
        className="flex flex-col relative w-full h-full opacity-100 transition-all duration-300 ease-in-out cursor-pointer list-none select-none"
        onClick={() => handleSlideClick(index)}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          transform: !isCurrent
            ? "scale(0.93) rotateX(6deg) translateY(8px)"
            : "scale(1) rotateX(0deg) translateY(0px)",
          transition: "transform 0.5s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.4s ease",
          transformOrigin: "bottom center",
          opacity: isCurrent ? 1 : 0.6,
        }}
      >
        <div
          className="w-full h-full transition-transform duration-150 ease-out"
          style={{
            transform: isCurrent
              ? "translate3d(calc(var(--x, 0) / 35), calc(var(--y, 0) / 35), 0)"
              : "none",
          }}
        >
          {children}
        </div>
      </li>
    </div>
  );
};

interface CarouselControlProps {
  type: "previous" | "next";
  title: string;
  handleClick: () => void;
  disabled?: boolean;
}

export const CarouselControl = ({
  type,
  title,
  handleClick,
  disabled = false,
}: CarouselControlProps) => {
  return (
    <button
      type="button"
      className="w-11 h-11 flex items-center justify-center rounded-full border border-neutral-700/60 bg-neutral-900/80 text-white backdrop-blur-md hover:bg-neutral-800 hover:border-cyan-500/50 hover:text-cyan-400 active:scale-95 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
      title={title}
      aria-label={title}
      onClick={handleClick}
      disabled={disabled}
    >
      {type === "previous" ? (
        <IconArrowNarrowLeft className="w-5 h-5" />
      ) : (
        <IconArrowNarrowRight className="w-5 h-5" />
      )}
    </button>
  );
};

export interface CarouselProps {
  slides?: SlideData[];
  items?: React.ReactNode[];
  children?: React.ReactNode;
  initialIndex?: number;
  className?: string;
  isRTL?: boolean;
  onIndexChange?: (index: number) => void;
  cardWidth?: number;
}

export default function Carousel({
  slides,
  items,
  children,
  initialIndex = 0,
  className = "",
  isRTL = false,
  onIndexChange,
  cardWidth = 360,
}: CarouselProps) {
  const contentList: React.ReactNode[] = items || (children ? React.Children.toArray(children) : []);
  const isCustom = contentList.length > 0;
  const totalCount = isCustom ? contentList.length : (slides?.length || 0);

  const [current, setCurrent] = useState(initialIndex);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(800);
  const gap = 20;

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };
    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  const handlePreviousClick = useCallback(() => {
    setCurrent(prev => {
      const nextIdx = prev <= 0 ? totalCount - 1 : prev - 1;
      onIndexChange?.(nextIdx);
      return nextIdx;
    });
  }, [totalCount, onIndexChange]);

  const handleNextClick = useCallback(() => {
    setCurrent(prev => {
      const nextIdx = prev >= totalCount - 1 ? 0 : prev + 1;
      onIndexChange?.(nextIdx);
      return nextIdx;
    });
  }, [totalCount, onIndexChange]);

  const handleSlideClick = useCallback((index: number) => {
    if (current !== index) {
      setCurrent(index);
      onIndexChange?.(index);
    }
  }, [current, onIndexChange]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        isRTL ? handleNextClick() : handlePreviousClick();
      } else if (e.key === "ArrowRight") {
        isRTL ? handlePreviousClick() : handleNextClick();
      }
    };
    const el = containerRef.current;
    if (el) {
      el.addEventListener("keydown", handleKeyDown);
      return () => el.removeEventListener("keydown", handleKeyDown);
    }
  }, [handleNextClick, handlePreviousClick, isRTL]);

  const touchStartX = useRef<number | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    touchStartX.current = null;
    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        isRTL ? handlePreviousClick() : handleNextClick();
      } else {
        isRTL ? handleNextClick() : handlePreviousClick();
      }
    }
  };

  const id = useId();

  if (totalCount === 0) return null;

  const effectiveCardWidth = Math.min(cardWidth, Math.max(280, containerWidth - 32));
  const centerOffset = (containerWidth - effectiveCardWidth) / 2;
  const slideStep = effectiveCardWidth + gap;
  const trackTranslate = isRTL
    ? -(centerOffset - current * slideStep)
    : centerOffset - current * slideStep;

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      className={`relative w-full overflow-hidden py-3 outline-none select-none ${className}`}
      aria-labelledby={`carousel-heading-${id}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="w-full overflow-hidden" style={{ minHeight: isCustom ? "560px" : "70vmin" }}>
        <ul
          className="flex transition-transform duration-600 ease-out will-change-transform m-0 p-0 list-none"
          style={{
            gap: `${gap}px`,
            transform: `translateX(${trackTranslate}px)`,
            transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        >
          {isCustom
            ? contentList.map((item, index) => (
                <CarouselCustomSlide
                  key={index}
                  index={index}
                  current={current}
                  handleSlideClick={handleSlideClick}
                  cardWidth={effectiveCardWidth}
                >
                  {item}
                </CarouselCustomSlide>
              ))
            : slides?.map((slide, index) => (
                <Slide
                  key={index}
                  slide={slide}
                  index={index}
                  current={current}
                  handleSlideClick={handleSlideClick}
                />
              ))}
        </ul>
      </div>

      <div className="flex items-center justify-between gap-4 mt-6 px-4 max-w-md mx-auto">
        <CarouselControl
          type="previous"
          title={isRTL ? "السابق" : "Previous"}
          handleClick={isRTL ? handleNextClick : handlePreviousClick}
        />

        <div className="flex items-center gap-1.5 overflow-hidden">
          {Array.from({ length: totalCount }).map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSlideClick(idx)}
              className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                current === idx
                  ? "w-7 bg-cyan-400"
                  : "w-2 bg-neutral-700 hover:bg-neutral-500"
              }`}
              aria-label={`Slide ${idx + 1}`}
            />
          ))}
        </div>

        <CarouselControl
          type="next"
          title={isRTL ? "التالي" : "Next"}
          handleClick={isRTL ? handlePreviousClick : handleNextClick}
        />
      </div>
    </div>
  );
}
export { Carousel };
