"use client";

interface SkeletonProps {
  className?: string;
  style?:     React.CSSProperties;
}

export function Skeleton({ className = "", style }: SkeletonProps) {
  return (
    <div
      className={`shimmer rounded ${className}`}
      style={{
        backgroundColor: "#E8EBF2",
        ...style,
      }}
    />
  );
}

// Pre-built skeleton shapes for common layouts
export function SkeletonText({ lines = 3, className = "" }: { lines?: number; className?: string }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          style={{
            height: "14px",
            width:  i === lines - 1 ? "60%" : "100%",
          }}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div
      className={`rounded-lg p-4 ${className}`}
      style={{
        background:  "#FFFFFF",
        borderWidth: "0.5px",
        borderStyle: "solid",
        borderColor: "#E8EBF2",
      }}
    >
      <Skeleton style={{ height: "12px", width: "40%", marginBottom: "12px" }} />
      <Skeleton style={{ height: "28px", width: "60%", marginBottom: "8px" }} />
      <Skeleton style={{ height: "12px", width: "80%" }} />
    </div>
  );
}
