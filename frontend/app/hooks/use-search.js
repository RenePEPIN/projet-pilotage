"use client";

import { createContext, useContext, useMemo, useState } from "react";

const SearchContext = createContext({
  query: "",
  setQuery: () => {},
});

export function SearchProvider({ children }) {
  const [query, setQuery] = useState("");

  const value = useMemo(() => ({ query, setQuery }), [query]);

  return (
    <SearchContext.Provider value={value}>{children}</SearchContext.Provider>
  );
}

export function useSearch() {
  return useContext(SearchContext);
}
