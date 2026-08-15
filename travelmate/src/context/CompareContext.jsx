import { createContext, useContext, useState } from "react";

const CompareContext = createContext();

export function CompareProvider({ children }) {
  const [compareList, setCompareList] = useState([]);

  const toggleCompare = (destination) => {
    setCompareList((prev) => {
      const exists = prev.some((d) => d._id === destination._id);
      if (exists) return prev.filter((d) => d._id !== destination._id);
      if (prev.length >= 3) {
        alert("You can compare up to 3 destinations at a time.");
        return prev;
      }
      return [...prev, destination];
    });
  };

  const isComparing = (id) => compareList.some((d) => d._id === id);
  const clearCompare = () => setCompareList([]);
  const removeFromCompare = (id) => setCompareList((prev) => prev.filter((d) => d._id !== id));

  return (
    <CompareContext.Provider value={{ compareList, toggleCompare, isComparing, clearCompare, removeFromCompare }}>
      {children}
    </CompareContext.Provider>
  );
}

export const useCompare = () => useContext(CompareContext);