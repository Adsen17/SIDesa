"use client";
import { createContext, useContext, useState } from "react";

const WargaContext = createContext();

export function WargaProvider({ children }) {
  const [data, setData] = useState([]);

  return (
    <WargaContext.Provider value={{ data, setData }}>
      {children}
    </WargaContext.Provider>
  );
}

export const useWarga = () => useContext(WargaContext);