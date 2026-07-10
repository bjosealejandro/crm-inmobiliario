export const MapEmbed = ({ direccion, zona, ciudad, className = "" }) => {
  const query = [direccion, zona, ciudad || "Tocancipá", "Colombia"].filter(Boolean).join(", ");
  if (!direccion && !zona && !ciudad) return null;
  return (
    <iframe
      title="Ubicación"
      className={className}
      style={{ border: 0 }}
      loading="lazy"
      src={`https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`}
    />
  );
};
