import React, { createContext, useContext, useState } from 'react';

type DetailType = 'cliente' | 'notizia';

interface DetailContextType {
  openDetail: (type: DetailType, id: string) => void;
  closeDetail: () => void;
  detail: { type: DetailType; id: string } | null;
}

const DetailContext = createContext<DetailContextType | undefined>(undefined);

export const DetailProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [detail, setDetail] = useState<{ type: DetailType; id: string } | null>(null);

  const openDetail = (type: DetailType, id: string) => setDetail({ type, id });
  const closeDetail = () => setDetail(null);

  return (
    <DetailContext.Provider value={{ openDetail, closeDetail, detail }}>
      {children}
    </DetailContext.Provider>
  );
};

export const useDetail = () => {
  const context = useContext(DetailContext);
  if (!context) throw new Error('useDetail must be used within a DetailProvider');
  return context;
};
