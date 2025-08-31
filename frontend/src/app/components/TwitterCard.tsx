"use client";

import Image from "next/image";

export default function TwitterCard() {
  // Uses public/test-images/twitter/{banner.jpg, profile.jpg}
  // Layout: square. Banner on top, profile avatar bottom-left overlapping banner edge,
  // and username label below.
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        borderRadius: 6,
        backgroundColor: "rgba(255,255,255,0.05)",
      }}
    >
      <div style={{ position: "absolute", inset: 0 }}>
        {/* Banner occupies top var(--banner) of the square */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "60%",
          }}
        >
          <Image
            src="/test-images/twitter/banner.jpg"
            alt="Twitter banner"
            fill
            sizes="100%"
            style={{ objectFit: "cover" }}
            unoptimized
            priority
          />
        </div>

        {/* Profile avatar overlapping the banner edge */}
        <div
          style={{
            position: "absolute",
            top: "calc(60% - 20%)",
            left: "6%",
            width: "40%",
            height: "40%",
            borderRadius: "50%",
            overflow: "hidden",
            border: "1px dashed rgba(206, 206, 206, 1)",
            backgroundColor: "#222",
          }}
        >
          <Image
            src="/test-images/twitter/profile.jpg"
            alt="Twitter profile"
            fill
            sizes="100%"
            style={{ objectFit: "cover" }}
            unoptimized
            priority
          />
        </div>

        {/* Username label at bottom-left */}
        <div
          className="username"
          style={{
            position: "absolute",
            left: "6%",
            bottom: 6,
            color: "#e5e5e5",
            letterSpacing: 0.2,
            textShadow: "0 1px 2px rgba(0,0,0,0.6)",
          }}
        >
          @mangagallery_
        </div>
      </div>
      <style jsx>{`
        .username { font-size: 10px; }
        @media (min-width: 640px) {
          .username { font-size: 14px; }
        }
      `}</style>
    </div>
  );
}
