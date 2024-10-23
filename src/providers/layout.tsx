"use client";

import { createContext, Dispatch, SetStateAction, useState } from "react";

interface ILayoutContext {
  viewArchivedQuestions: boolean;
  setViewArchivedQuestions: Dispatch<SetStateAction<boolean>>;
}
export const LayoutContext = createContext<ILayoutContext>({
  viewArchivedQuestions: false,
  setViewArchivedQuestions: () => {},
});

interface ILayoutProviderProps {
  children: React.ReactNode;
}

export const LayoutProvider = ({ children }: ILayoutProviderProps) => {
  const [viewArchivedQuestions, setViewArchivedQuestions] = useState(false);

  const value: ILayoutContext = {
    viewArchivedQuestions,
    setViewArchivedQuestions,
  };

  return (
    <LayoutContext.Provider value={value}>{children}</LayoutContext.Provider>
  );
};
