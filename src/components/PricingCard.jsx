/**
 * @param {{
 *   title: string;
 *   price: string;
 *   description: string;
 *   buttonLabel: string;
 *   buttonLink: string;
 *   onButtonClick?: () => void;
 *   disabled?: boolean;
 * }} props
 */
export default function PricingCard({
  title,
  price,
  description,
  buttonLabel,
  buttonLink,
  onButtonClick,
  disabled = false,
}) {
  return (
    <div style={styles.card}>
      <h3 style={styles.title}>{title}</h3>
      <p style={styles.price}>{price}</p>
      <p style={styles.description}>{description}</p>
      <button
        type="button"
        onClick={onButtonClick}
        disabled={disabled}
        style={{
          ...styles.button,
          ...(disabled ? styles.buttonDisabled : {}),
        }}
        aria-label={`${buttonLabel} (${buttonLink})`}
      >
        {buttonLabel}
      </button>
    </div>
  );
}

const styles = {
  card: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 14,
    padding: 24,
    boxShadow: "0 8px 30px rgba(0,0,0,0.2)",
    textAlign: "center",
    backdropFilter: "blur(12px)",
  },
  title: { margin: 0, fontSize: "1.2rem", color: "#f4f4f5" },
  price: { margin: "10px 0 12px", fontSize: "2rem", color: "#818cf8", fontWeight: 700 },
  description: { margin: 0, color: "#a1a1aa", fontSize: "0.95rem", lineHeight: 1.5 },
  button: {
    marginTop: 16,
    display: "inline-block",
    background: "#4f46e5",
    color: "#ffffff",
    fontWeight: 600,
    borderRadius: 10,
    padding: "10px 18px",
    border: "1px solid #4338ca",
    cursor: "pointer",
  },
  buttonDisabled: { opacity: 0.55, cursor: "not-allowed" },
};

