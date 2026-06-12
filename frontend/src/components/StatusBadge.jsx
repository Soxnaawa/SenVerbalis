

const StatusBadge = ({ status }) => {
  const config = {
    en_attente: {
      label: "En attente",
      styles: {
        color: "#FECB00",
        backgroundColor: "rgba(254, 203, 0, 0.1)",
        border: "1px solid rgba(254, 203, 0, 0.2)"
      }
    },
    reglee: {
      label: "Réglée / Payée",
      styles: {
        color: "#006B3F",
        backgroundColor: "rgba(0, 107, 63, 0.1)",
        border: "1px solid rgba(0, 107, 63, 0.2)"
      }
    },
    contestee: {
      label: "Contestée",
      styles: {
        color: "#D21034",
        backgroundColor: "rgba(210, 16, 52, 0.1)",
        border: "1px solid rgba(210, 16, 52, 0.2)"
      }
    }
  };

  const current = config[status] || {
    label: status,
    styles: {
      color: "#9CA3AF",
      backgroundColor: "rgba(156, 163, 175, 0.1)",
      border: "1px solid rgba(156, 163, 175, 0.2)"
    }
  };

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      fontSize: '12px',
      fontWeight: '500',
      padding: '4px 10px',
      borderRadius: '9999px',
      fontFamily: 'Outfit, sans-serif',
      ...current.styles
    }}>
      {current.label}
    </span>
  );
};

export default StatusBadge;
