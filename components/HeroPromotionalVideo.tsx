'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Pause, Play, Volume2, VolumeX } from 'lucide-react';
import { motion } from 'motion/react';

interface HeroPromotionalVideoProps {
  supportText?: string;
}

export function HeroPromotionalVideo({ supportText }: HeroPromotionalVideoProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = true;
    video.defaultMuted = true;
    video.loop = true;
    video.playsInline = true;

    const attemptAutoplay = async () => {
      try {
        await video.play();
        setIsPlaying(true);
      } catch {
        setIsPlaying(!video.paused);
      }
    };

    void attemptAutoplay();
  }, []);

  const togglePlayPause = async () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused || video.ended) {
      try {
        await video.play();
        setIsPlaying(true);
      } catch {
        setIsPlaying(false);
      }
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    const nextMuted = !video.muted;
    video.muted = nextMuted;
    setIsMuted(nextMuted);
  };

  const handleEnded = () => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = 0;
    void video.play().catch(() => {});
  };

  return (
    <>
      {/* Promotional Video Stage Directly Below Navigation Bar */}
      <section
        aria-label="CHAI WALA UK Promotional Film"
        className="bg-[#063B20] border-b border-[#D9AD55]/30"
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-7 lg:py-8">
          <motion.div
            initial={{ opacity: 0.92, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full aspect-video rounded-xl sm:rounded-2xl overflow-hidden bg-[#032C1B] border border-[#D9AD55]/35 shadow-2xl"
          >
            <video
              ref={videoRef}
              src="/chai-wala-uk-commercial.mp4"
              poster="/images/chai-wala-uk-commercial-poster.jpg"
              autoPlay
              muted={isMuted}
              loop
              playsInline
              preload="auto"
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onEnded={handleEnded}
              aria-label="CHAI WALA UK promotional video showcasing tea leaves, stovetop desi chai, London scenes, and CHAI WALA packaging"
              className="w-full h-full object-contain bg-[#032C1B] block"
            />

            {/* Subtle bottom vignette only under corner controls */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/55 via-black/15 to-transparent"
            />

            {/* Play/Pause & Sound Controls */}
            <div className="absolute bottom-3 right-3 sm:bottom-5 sm:right-5 z-10 flex items-center gap-2 sm:gap-2.5">
              <button
                type="button"
                onClick={togglePlayPause}
                aria-label={isPlaying ? 'Pause promotional video' : 'Play promotional video'}
                aria-pressed={!isPlaying}
                className="inline-flex items-center justify-center gap-1.5 min-h-[40px] px-3.5 py-2 rounded-lg bg-[#032C1B]/85 hover:bg-[#063B20] text-[#FFF8E9] border border-[#D9AD55]/45 backdrop-blur-sm text-xs font-medium transition-colors cursor-pointer whitespace-nowrap"
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-4 h-4 text-[#D9AD55]" />
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 text-[#D9AD55]" />
                    <span>Play</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={toggleMute}
                aria-label={isMuted ? 'Unmute video sound' : 'Mute video sound'}
                aria-pressed={!isMuted}
                className="inline-flex items-center justify-center gap-1.5 min-h-[40px] px-3.5 py-2 rounded-lg bg-[#032C1B]/85 hover:bg-[#063B20] text-[#FFF8E9] border border-[#D9AD55]/45 backdrop-blur-sm text-xs font-medium transition-colors cursor-pointer whitespace-nowrap"
              >
                {isMuted ? (
                  <>
                    <VolumeX className="w-4 h-4 text-[#D9AD55]" />
                    <span>Unmute</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-4 h-4 text-[#D9AD55]" />
                    <span>Sound On</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Separate Brand Introduction Text Section Below Video */}
      <section className="bg-[#FFF8E9] border-b border-[#382015]/10">
        <motion.div
          initial={{ opacity: 0.92, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 text-center space-y-5"
        >
          <p className="text-xs sm:text-sm font-semibold uppercase tracking-[0.24em] text-[#063B20]">
            CHAI WALA UK
          </p>

          <div aria-hidden="true" className="w-16 h-px bg-[#D9AD55] mx-auto" />

          <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-bold leading-[1.1] tracking-tight text-[#382015]">
            Authentic Taste... Now in the UK!
          </h1>

          <p className="text-xs sm:text-sm font-semibold uppercase tracking-[0.24em] text-[#8A6108]">
            TEA • TRADITION • GOOD MOOD
          </p>

          {supportText && (
            <p className="text-sm sm:text-base text-[#6B4D3E] max-w-2xl mx-auto leading-relaxed pt-1">
              {supportText}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-center gap-4 pt-3">
            <a
              href="#shop"
              className="inline-flex items-center justify-center gap-2 min-h-[44px] px-8 py-3.5 rounded-lg bg-[#D9AD55] text-[#382015] font-semibold text-sm tracking-wide uppercase hover:bg-[#C2963E] transition-colors whitespace-nowrap shadow-sm"
            >
              <span>SHOP NOW</span>
              <ArrowRight className="w-4 h-4" />
            </a>

            <Link
              href="/our-tea"
              className="inline-flex items-center justify-center gap-2 min-h-[44px] px-7 py-3.5 rounded-lg border border-[#063B20]/30 text-[#063B20] font-medium text-sm hover:bg-[#063B20]/5 transition-colors whitespace-nowrap"
            >
              <span>Discover Our Tea</span>
            </Link>
          </div>
        </motion.div>
      </section>
    </>
  );
}
