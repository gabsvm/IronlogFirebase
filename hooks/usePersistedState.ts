
import { useState, useEffect, useCallback } from 'react';
import { db } from '../utils/db';

/**
 * Hook to manage state persisted in IndexedDB.
 * Returns [state, setState, isLoading]
 */
export function usePersistedState<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void, boolean] {
    const [state, setState] = useState<T>(initialValue);
    const [isLoading, setIsLoading] = useState(true);

    // Initial Load
    useEffect(() => {
        let isMounted = true;
        setIsLoading(true);
        
        db.get<T>(key, initialValue).then((val) => {
            if (isMounted) {
                setState(val);
                setIsLoading(false);
            }
        });

        return () => { isMounted = false; };
    }, [key]); // Only run on mount or key change

    // Setter wrapper
    const setPersistedState = useCallback((value: T | ((val: T) => T)) => {
        setState((prev) => {
            // Allow functional updates like useState
            const newValue = value instanceof Function ? value(prev) : value;
            
            // Fire and forget save (IndexedDB is async)
            db.set(key, newValue);
            
            return newValue;
        });
    }, [key]);

    return [state, setPersistedState, isLoading];
}
