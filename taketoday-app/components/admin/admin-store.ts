"use client";

import { create } from "zustand";

type AdminState = {
  commandOpen: boolean;
  selectedWorkspace: string;
  role: string;
  name: string;
  selectedCategory: string | null;
  setCommandOpen: (open: boolean) => void;
  setSelectedWorkspace: (workspace: string) => void;
  setRole: (role: string) => void;
  setName: (name: string) => void;
  setSelectedCategory: (category: string | null) => void;
};

export const useAdminStore = create<AdminState>((set) => ({
  commandOpen: false,
  selectedWorkspace: "TakeToday Editorial",
  role: "",
  name: "",
  selectedCategory: null,
  setCommandOpen: (commandOpen) => set({ commandOpen }),
  setSelectedWorkspace: (selectedWorkspace) => set({ selectedWorkspace }),
  setRole: (role) => set({ role }),
  setName: (name) => set({ name }),
  setSelectedCategory: (selectedCategory) => set({ selectedCategory }),
}));
