"use client";

import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import {
  IoMoon,
  IoMoonOutline,
  IoSunny,
  IoSunnyOutline,
} from "react-icons/io5";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

export const SwitchMode = ({
  width,
  height = 34,
  modes = ["light", "dark"],
  darkColor = "#0f172a", // slate-900
  lightColor = "#f1f5f9", // slate-100
  knobDarkColor = "#1e293b", // slate-800
  knobLightColor = "#ffffff", // white
  borderDarkColor = "#334155", // slate-700
  borderLightColor = "#e2e8f0", // slate-200
  className = "",
}) => {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme, resolvedTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
    // If previously saved theme in localStorage was 'system', normalize to light or dark
    if (theme === "system") {
      setTheme(resolvedTheme === "dark" ? "dark" : "light");
    }
  }, [theme, resolvedTheme, setTheme]);

  const totalSegments = modes.length;
  // Calculate segment width so knob is perfectly proportioned
  const segmentWidth = Math.round(height * 0.95);
  const computedWidth = width || segmentWidth * totalSegments + 6;

  if (!mounted) {
    return (
      <div
        style={{ width: computedWidth, height }}
        className={cn(
          "rounded-full border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/80 animate-pulse",
          className
        )}
      />
    );
  }

  const isDark = resolvedTheme === "dark" || theme === "dark";
  const iconSize = Math.max(14, Math.round(height * 0.44));

  const getActiveIndex = () => {
    const current = (theme === "dark" || (!theme && isDark)) ? "dark" : "light";
    const idx = modes.indexOf(current);
    return idx >= 0 ? idx : 0;
  };

  const activeIndex = getActiveIndex();

  return (
    <div
      role="radiogroup"
      aria-label="Theme preference selector"
      className={cn(
        "relative inline-flex items-center rounded-full border transition-colors p-0.5 select-none shadow-inner",
        className
      )}
      style={{
        width: computedWidth,
        height,
        backgroundColor: isDark ? darkColor : lightColor,
        borderColor: isDark ? borderDarkColor : borderLightColor,
      }}
    >
      {/* SLIDING ANIMATED SPRING KNOB */}
      <motion.div
        layout
        layoutId="switch-knob"
        transition={{ type: "spring", stiffness: 340, damping: 25 }}
        className="absolute rounded-full shadow-sm z-10 border"
        style={{
          width: segmentWidth,
          height: height - 5,
          left: 2 + activeIndex * segmentWidth,
          backgroundColor: isDark ? knobDarkColor : knobLightColor,
          borderColor: isDark ? borderDarkColor : borderLightColor,
        }}
      />

      {/* MODE SEGMENTS */}
      {modes.map((mode) => {
        const isActive = mode === "dark" ? isDark : !isDark;

        let IconActive = IoSunny;
        let IconInactive = IoSunnyOutline;
        let activeColor = "#f59e0b"; // amber-500
        let label = "Light mode";

        if (mode === "dark") {
          IconActive = IoMoon;
          IconInactive = IoMoonOutline;
          activeColor = "#38bdf8"; // sky-400
          label = "Dark mode";
        }

        return (
          <button
            key={mode}
            type="button"
            role="radio"
            aria-checked={isActive}
            title={label}
            onClick={() => setTheme(mode)}
            className="relative z-20 flex items-center justify-center rounded-full transition-transform active:scale-95 focus:outline-none cursor-pointer"
            style={{ width: segmentWidth, height: height - 5 }}
          >
            <motion.div
              animate={{
                scale: isActive ? 1.08 : 0.95,
                rotate: isActive ? (mode === "dark" ? -8 : 12) : 0,
              }}
              transition={{ duration: 0.2 }}
            >
              {isActive ? (
                <IconActive
                  style={{ width: iconSize, height: iconSize, color: activeColor }}
                  className="transition-colors duration-200"
                />
              ) : (
                <IconInactive
                  style={{ width: iconSize, height: iconSize, color: "#94a3b8" }}
                  className="transition-colors duration-200 hover:text-slate-600 dark:hover:text-slate-200"
                />
              )}
            </motion.div>
            <span className="sr-only">{label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default SwitchMode;
