export function BrandLogo({
  className = "",
  priority = false,
}: {
  className?: string;
  priority?: boolean;
}) {
  return (
    <img
      className={`logo ${className}`.trim()}
      src="/logo.png"
      alt="RG Motors"
      width={885}
      height={300}
      decoding={priority ? "sync" : "async"}
      fetchPriority={priority ? "high" : "auto"}
    />
  );
}
