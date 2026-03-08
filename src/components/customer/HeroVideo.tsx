"use client";

import { useRef, useEffect, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";

export function HeroVideo() {
  const ref = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 1.1]);
  const textY = useTransform(scrollYProgress, [0, 0.5], [0, -80]);
  const overlayOpacity = useTransform(scrollYProgress, [0, 0.3], [0.35, 0.7]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.play().catch(() => {});
  }, []);

  return (
    <div ref={ref} className="relative h-screen w-full overflow-hidden">
      {/* Video Background */}
      <motion.div style={{ scale }} className="absolute inset-0">
        <video
          ref={videoRef}
          className={`h-full w-full object-cover transition-opacity duration-1000 ${isLoaded ? "opacity-100" : "opacity-0"}`}
          src="/hero-video.mp4"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          onLoadedData={() => setIsLoaded(true)}
        />
      </motion.div>

      {/* Gradient Overlay */}
      <motion.div
        style={{ opacity: overlayOpacity }}
        className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-black/80"
      />

      {/* Subtle grain texture */}
      <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay"
        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")" }}
      />

      {/* Content */}
      <motion.div
        style={{ y: textY, opacity }}
        className="relative z-10 flex h-full flex-col items-center justify-center px-4 text-center"
      >
        {/* Top accent line */}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: 60 }}
          transition={{ duration: 1.2, delay: 0.5, ease: "easeOut" }}
          className="mb-8 h-[1px] bg-[#b8945f]"
        />

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mb-4 text-[11px] font-light tracking-[0.5em] text-white/70 uppercase sm:text-xs"
        >
          LPGA Member &middot; TPI Certified
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.6 }}
          className="mb-2 text-4xl font-extralight leading-tight tracking-wider text-white sm:text-6xl lg:text-7xl"
        >
          美しいスイングで、
        </motion.h1>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="mb-8 text-4xl font-extralight leading-tight tracking-wider sm:text-6xl lg:text-7xl"
        >
          <span className="text-[#b8945f]">ゴルフをもっと楽しく。</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.2 }}
          className="mb-12 max-w-lg text-sm font-light leading-relaxed text-white/60 sm:text-base"
        >
          あなたの身体と骨格に合った、
          <br className="hidden sm:block" />
          崩れにくいスイングを一緒に作ります。
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.5 }}
          className="flex flex-col gap-4 sm:flex-row"
        >
          <Link
            href="/schedule"
            className="group relative overflow-hidden rounded-full border border-white/30 bg-white/10 px-10 py-3.5 text-sm font-light tracking-wider text-white backdrop-blur-sm transition-all duration-500 hover:border-[#b8945f] hover:bg-[#b8945f]/20"
          >
            <span className="relative z-10">空き枠を確認する</span>
          </Link>
          <Link
            href="/lessons"
            className="rounded-full border border-white/10 px-10 py-3.5 text-sm font-light tracking-wider text-white/60 transition-all duration-500 hover:border-white/30 hover:text-white"
          >
            レッスンプランを見る
          </Link>
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.5 }}
        className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="flex flex-col items-center gap-2"
        >
          <span className="text-[10px] tracking-[0.3em] text-white/40 uppercase">Scroll</span>
          <div className="h-8 w-[1px] bg-gradient-to-b from-white/40 to-transparent" />
        </motion.div>
      </motion.div>
    </div>
  );
}
