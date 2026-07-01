export const userPublicSelect = {
  id: true,
  name: true,
  email: true,
  createdAt: true,
};

export const userBasicSelect = {
  id: true,
  name: true,
  email: true,
};

export const workspaceBasicSelect = {
  id: true,
  name: true,
  description: true,
  createdAt: true,
  updatedAt: true,
};

export const projectBasicSelect = {
  id: true,
  name: true,
  description: true,
  createdAt: true,
  updatedAt: true,
};

export const memberPublicSelect = {
  id: true,
  role: true,
  createdAt: true,
  user: {
    select: userBasicSelect,
  },
};

