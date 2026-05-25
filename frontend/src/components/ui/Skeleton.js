export default function Skeleton({ className = "", variant = "default" }) {
  const baseClasses = "animate-pulse bg-white/10 rounded";
  
  const variants = {
    default: baseClasses,
    card: "animate-pulse bg-white/10 rounded-lg h-48",
    text: "animate-pulse bg-white/10 rounded h-4 w-3/4",
    avatar: "animate-pulse bg-white/10 rounded-full h-12 w-12",
    button: "animate-pulse bg-white/10 rounded h-10 w-24",
    title: "animate-pulse bg-white/10 rounded h-8 w-1/2",
    input: "animate-pulse bg-white/10 rounded h-10 w-full",
    image: "animate-pulse bg-white/10 rounded-lg h-64 w-full"
  };
  
  return (
    <div className={`${variants[variant] || baseClasses} ${className}`} />
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-white/5 rounded-lg p-4 space-y-3">
      <Skeleton variant="image" className="h-32" />
      <Skeleton variant="title" />
      <Skeleton variant="text" className="w-full" />
      <Skeleton variant="text" className="w-2/3" />
      <div className="flex justify-between items-center pt-2">
        <Skeleton variant="button" />
        <Skeleton variant="button" className="w-16" />
      </div>
    </div>
  );
}

export function AuctionCardSkeleton() {
  return (
    <div className="bg-white/5 rounded-lg overflow-hidden border border-white/10 hover:border-white/20 transition-all">
      <Skeleton variant="image" className="h-48" />
      <div className="p-4 space-y-3">
        <Skeleton variant="title" />
        <div className="flex items-center space-x-2">
          <Skeleton variant="avatar" className="h-6 w-6" />
          <Skeleton variant="text" className="w-24 h-3" />
        </div>
        <Skeleton variant="text" className="w-full h-3" />
        <div className="flex justify-between items-center pt-2">
          <div className="space-y-1">
            <Skeleton variant="text" className="w-16 h-4" />
            <Skeleton variant="text" className="w-20 h-3" />
          </div>
          <Skeleton variant="button" className="w-20" />
        </div>
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5 }) {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-4 gap-4 p-4 border-b border-white/10">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} variant="text" className="h-4" />
        ))}
      </div>
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="grid grid-cols-4 gap-4 p-4 border-b border-white/5">
          {[...Array(4)].map((_, j) => (
            <Skeleton key={j} variant="text" className="h-4" />
          ))}
        </div>
      ))}
    </div>
  );
}
