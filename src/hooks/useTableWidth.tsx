import { useState, useEffect, RefObject } from 'react';

export function useTableWidth<T extends HTMLElement>(ref: RefObject<T>): number {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (!ref.current) return;

    const updateWidth = () => {
      if (ref.current) {
        setWidth(ref.current.offsetWidth);
      }
    };

    // Inicializar largura
    updateWidth();

    // Observar mudanças de tamanho
    const resizeObserver = new ResizeObserver(updateWidth);
    resizeObserver.observe(ref.current);

    // Também observar mudanças na janela
    window.addEventListener('resize', updateWidth);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateWidth);
    };
  }, [ref]);

  return width;
}

