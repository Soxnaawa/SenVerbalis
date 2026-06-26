// API client for SenVerbalis Backend
const API_BASE_URL = ""; // Empty string because we proxy through Vite server /api

let tokenRef = { current: null };

export const setClientToken = (token) => {
  tokenRef.current = token;
};

async function request(endpoint, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (tokenRef.current) {
    headers["Authorization"] = `Bearer ${tokenRef.current}`;
  }

  const config = {
    ...options,
    headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

  if (response.status === 401) {
    // Session expired or invalid token
    setClientToken(null);
    window.dispatchEvent(new CustomEvent("unauthorized"));
    throw new Error("Session expirée. Veuillez vous reconnecter.");
  }

  if (!response.ok) {
    let errorDetail = "Une erreur est survenue.";
    try {
      const errData = await response.json();
      errorDetail = errData.detail || errorDetail;
    } catch {
      // Not JSON
    }
    throw new Error(errorDetail);
  }

  // Logout or delete user might not return JSON content
  if (response.status === 204 || response.status === 200 && response.headers.get("content-length") === "0") {
    return null;
  }

  try {
    return await response.json();
  } catch {
    return null;
  }
}

export const api = {
  // Authentication & Profile
  login: async (username, password) => {
    const response = await fetch(`/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      let errorDetail = "Identifiants invalides.";
      try {
        const errData = await response.json();
        errorDetail = errData.detail || errorDetail;
      } catch {}
      throw new Error(errorDetail);
    }
    return response.json(); // returns { access_token, token_type }
  },

  logout: async () => {
    return request("/api/auth/logout", { method: "POST" });
  },

  getMe: async () => {
    return request("/api/auth/me");
  },

  // PVs management
  creerPV: async (pvData) => {
    return request("/api/pvs/", {
      method: "POST",
      body: JSON.stringify(pvData),
    });
  },

  getMesPVs: async () => {
    return request("/api/pvs/mes-pvs");
  },

  getTousLesPVs: async () => {
    return request("/api/pvs/tous");
  },

  getPV: async (id) => {
    return request(`/api/pvs/${id}`);
  },

  majStatut: async (id, statut) => {
    return request(`/api/pvs/${id}/statut`, {
      method: "PATCH",
      body: JSON.stringify({ statut }),
    });
  },

  verifierIntegrite: async (id) => {
    return request(`/api/pvs/${id}/integrite`);
  },

  recherchePVs: async ({ plaque, type_infraction, lieu, statut } = {}) => {
    const params = new URLSearchParams();
    if (plaque) params.append("plaque", plaque);
    if (type_infraction) params.append("type_infraction", type_infraction);
    if (lieu) params.append("lieu", lieu);
    if (statut) params.append("statut", statut);
    return request(`/api/pvs/recherche?${params.toString()}`);
  },

  // Admin User management
  getUsers: async () => {
    return request("/api/auth/users");
  },

  createUser: async (userData) => {
    return request("/api/auth/users", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  },

  deactivateUser: async (username) => {
    return request(`/api/auth/users/${username}`, {
      method: "DELETE",
    });
  },

  reactivateUser: async (username) => {
    return request(`/api/auth/users/${username}/reactiver`, {
      method: "POST",
    });
  },

  changePassword: async (old_password, new_password) => {
    return request("/api/auth/users/me/password", {
      method: "PATCH",
      body: JSON.stringify({ old_password, new_password }),
    });
  },

  getAuditLogs: async (skip = 0, limit = 50) => {
    return request(`/api/auth/audit-logs?skip=${skip}&limit=${limit}`);
  },

  getDashboardStats: async () => {
    return request("/api/pvs/superviseur/stats");
  },

  getCitoyenPVs: async (numPermisHash) => {
    const response = await fetch(`/api/pvs/citoyen/${numPermisHash}`);
    if (!response.ok) {
      let errorDetail = "Impossible de récupérer les infractions.";
      try {
        const errData = await response.json();
        errorDetail = errData.detail || errorDetail;
      } catch {}
      throw new Error(errorDetail);
    }
    return response.json();
  }
};


