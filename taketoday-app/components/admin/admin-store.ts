"use client";

import { create } from "zustand";

type AdminState = {
  commandOpen: boolean;
  selectedWorkspace: string;
  setCommandOpen: (open: boolean) => void;
  setSelectedWorkspace: (workspace: string) => void;
};

export const useAdminStore = create<AdminState>((set) => ({
  commandOpen: false,
  selectedWorkspace: "TakeToday Editorial",
  setCommandOpen: (commandOpen) => set({ commandOpen }),
  setSelectedWorkspace: (selectedWorkspace) => set({ selectedWorkspace }),
}));
