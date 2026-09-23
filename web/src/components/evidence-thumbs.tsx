type Props = {
  urls: string[];
  label?: string;
};

/** Miniaturas de evidencia (URLs ya firmadas). */
export function EvidenceThumbs({ urls, label }: Props) {
  const list = urls.filter(Boolean);
  if (list.length === 0) return null;
  return (
    <div className="evidence-thumbs">
      {label ? <span className="evidence-label">{label}</span> : null}
      <div className="evidence-row">
        {list.map((url) => (
          <a key={url} href={url} target="_blank" rel="noreferrer" className="evidence-link">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="Evidencia" className="evidence-img" />
          </a>
        ))}
      </div>
    </div>
  );
}
