type LoadingDialogProps = {
    message: string;
};

export default function LoadingDialog({ message }: LoadingDialogProps) {
    return (
        <div className="loading-overlay">
            <div className="loading-box">
                <div className="loading-spinner" />
                <p>{message}</p>
            </div>
        </div>
    );
}