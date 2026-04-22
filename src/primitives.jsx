// Small reusable primitives: Badge, Chip, Button, CompanyLogo, Avatar, etc.

const { useState } = React;

function Badge({ children, tone = "neutral", size = "sm" }) {
  const tones = {
    neutral: { bg: "#F3F1EA", ink: "#3A3A35" },
    accent:  { bg: "var(--accent-bg)", ink: "var(--accent-ink)" },
    blue:    { bg: "var(--blue-bg)", ink: "var(--blue-ink)" },
    warn:    { bg: "var(--warn-bg)", ink: "var(--warn-ink)" },
    rose:    { bg: "var(--rose-bg)", ink: "var(--rose-ink)" },
    outline: { bg: "transparent", ink: "#3A3A35", border: "1px solid var(--line)" },
  };
  const t = tones[tone] || tones.neutral;
  const padY = size === "sm" ? "2px" : "4px";
  const padX = size === "sm" ? "7px" : "9px";
  const fs = size === "sm" ? "11.5px" : "12.5px";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      background: t.bg, color: t.ink,
      padding: `${padY} ${padX}`,
      borderRadius: 999,
      fontSize: fs, fontWeight: 500,
      letterSpacing: "-0.005em",
      border: t.border || "none",
      whiteSpace: "nowrap",
      lineHeight: 1.2,
    }}>{children}</span>
  );
}

function Chip({ active, onClick, children }) {
  return (
    <button onClick={onClick} style={{
      padding: "6px 11px",
      borderRadius: 6,
      fontSize: 13, fontWeight: 500,
      background: active ? "var(--ink)" : "transparent",
      color: active ? "#FAFAF7" : "var(--ink-2)",
      border: active ? "1px solid var(--ink)" : "1px solid var(--line)",
      transition: "all 0.12s ease",
    }}>{children}</button>
  );
}

function Button({ variant = "primary", size = "md", children, onClick, type, disabled, style = {}, icon, iconRight }) {
  const sizes = {
    sm: { padY: "5px", padX: "10px", fs: 13 },
    md: { padY: "8px", padX: "14px", fs: 13.5 },
    lg: { padY: "11px", padX: "18px", fs: 14.5 },
  }[size];
  const variants = {
    primary:   { bg: "var(--ink)", color: "#FAFAF7", border: "1px solid var(--ink)", hover: "#2A2A25" },
    secondary: { bg: "var(--panel)", color: "var(--ink)", border: "1px solid var(--line)", hover: "#F3F1EA" },
    ghost:     { bg: "transparent", color: "var(--ink-2)", border: "1px solid transparent", hover: "#F3F1EA" },
    accent:    { bg: "var(--accent)", color: "#fff", border: "1px solid var(--accent)", hover: "oklch(0.55 0.12 145)" },
  };
  const v = variants[variant] || variants.primary;
  const [hover, setHover] = useState(false);
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        padding: `${sizes.padY} ${sizes.padX}`,
        borderRadius: 6,
        fontSize: sizes.fs, fontWeight: 500,
        background: hover && !disabled ? v.hover : v.bg,
        color: v.color,
        border: v.border,
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "all 0.12s ease",
        letterSpacing: "-0.005em",
        ...style,
      }}>
      {icon}{children}{iconRight}
    </button>
  );
}

function CompanyLogo({ company, size = 32 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.25,
      background: company.tint || company.company_tint,
      color: "oklch(0.28 0.06 145)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontWeight: 600, fontSize: size * 0.38,
      letterSpacing: "-0.02em",
      flexShrink: 0,
    }}>
      {company.logo || company.company_logo}
    </div>
  );
}

function Avatar({ name, size = 28 }) {
  const initials = (name || "?").split(" ").map(s => s[0]).slice(0,2).join("");
  const hash = [...(name || "")].reduce((a,c) => a + c.charCodeAt(0), 0);
  const hue = (hash * 47) % 360;
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: `oklch(0.86 0.05 ${hue})`,
      color: `oklch(0.28 0.08 ${hue})`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontWeight: 600, fontSize: size * 0.40,
      flexShrink: 0,
      letterSpacing: "-0.02em",
    }}>{initials}</div>
  );
}

function StatusDot({ tone = "accent" }) {
  const colors = {
    accent: "var(--accent)",
    warn: "oklch(0.72 0.15 75)",
    rose: "oklch(0.65 0.17 25)",
    blue: "oklch(0.60 0.12 250)",
    muted: "#9A9A90",
  };
  return <span style={{
    display: "inline-block", width: 6, height: 6, borderRadius: "50%",
    background: colors[tone] || colors.muted, flexShrink: 0,
  }} />;
}

function Field({ label, hint, error, children, required, optional }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <label style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)" }}>
          {label}{required && <span style={{ color: "var(--rose-ink)", marginLeft: 2 }}>*</span>}
        </label>
        {optional && <span style={{ fontSize: 11.5, color: "var(--faint)" }}>optional</span>}
      </div>
      {children}
      {hint && !error && <div style={{ fontSize: 12, color: "var(--faint)" }}>{hint}</div>}
      {error && <div style={{ fontSize: 12, color: "var(--rose-ink)" }}>{error}</div>}
    </div>
  );
}

function Input({ value, onChange, placeholder, type = "text", prefix }) {
  return (
    <div style={{
      display: "flex", alignItems: "center",
      border: "1px solid var(--line)",
      borderRadius: 6, background: "var(--panel)",
      transition: "border-color 0.12s",
    }}
    onFocus={(e) => e.currentTarget.style.borderColor = "var(--ink)"}
    onBlur={(e) => e.currentTarget.style.borderColor = "var(--line)"}
    >
      {prefix && <span style={{ paddingLeft: 10, color: "var(--faint)", fontSize: 13 }}>{prefix}</span>}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange && onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          flex: 1, border: "none", background: "transparent", outline: "none",
          padding: "9px 11px", fontSize: 13.5, color: "var(--ink)",
        }}
      />
    </div>
  );
}

function Textarea({ value, onChange, placeholder, rows = 4 }) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange && onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      style={{
        border: "1px solid var(--line)", borderRadius: 6,
        background: "var(--panel)", padding: "10px 12px",
        fontSize: 13.5, color: "var(--ink)", resize: "vertical",
        outline: "none", width: "100%",
        fontFamily: "inherit", lineHeight: 1.55,
      }}
      onFocus={(e) => e.currentTarget.style.borderColor = "var(--ink)"}
      onBlur={(e) => e.currentTarget.style.borderColor = "var(--line)"}
    />
  );
}

function Divider({ vertical, my = 16, mx = 16 }) {
  if (vertical) return <div style={{ width: 1, alignSelf: "stretch", background: "var(--line)", margin: `0 ${mx}px` }} />;
  return <div style={{ height: 1, background: "var(--line)", margin: `${my}px 0` }} />;
}

window.HH_P = { Badge, Chip, Button, CompanyLogo, Avatar, StatusDot, Field, Input, Textarea, Divider };
