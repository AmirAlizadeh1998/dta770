import {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useState,
    type ReactNode, useEffect,
} from "react";
import LoadingDialog from "../components/LoadingDialog";
import {registerLoadingHandler} from "../services/LoadingService.ts";

type LoadingContextType = {
    loading: boolean;
    message: string;
    showLoading: (message?: string) => void;
    hideLoading: () => void;
};

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

type LoadingProviderProps = {
    children: ReactNode;
};

export function LoadingProvider({ children }: LoadingProviderProps) {
    const [count, setCount] = useState<number>(0);
    const [message, setMessage] = useState<string>("در حال بارگذاری...");

    const showLoading = useCallback((text: string = "در حال بارگذاری...") => {
        setMessage(text);
        setCount((prev) => prev + 1);
    }, []);

    const hideLoading = useCallback(() => {
        setCount((prev) => Math.max(0, prev - 1));
    }, []);

    const value = useMemo(
        () => ({
            loading: count > 0,
            message,
            showLoading,
            hideLoading,
        }),
        [count, message, showLoading, hideLoading]
    );

    useEffect(() => {
        registerLoadingHandler({
            show: showLoading,
            hide: hideLoading
        })
    }, [showLoading, hideLoading])

    return (
        <LoadingContext.Provider value={value}>
            {children}
            {count > 0 && <LoadingDialog message={message} />}
        </LoadingContext.Provider>
    );
}

export function useLoading(): LoadingContextType {
    const context = useContext(LoadingContext);

    if (!context) {
        throw new Error("useLoading must be used within LoadingProvider");
    }

    return context;
}